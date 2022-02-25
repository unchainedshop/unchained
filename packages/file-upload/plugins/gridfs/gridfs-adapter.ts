import { File, IFileAdapter } from '@unchainedshop/types/files';
import { FileAdapter, FileDirector } from 'meteor/unchained:file-upload';
import https from 'https';
import http from 'http';
import { log, LogLevel } from 'meteor/unchained:logger';
import mimeType from 'mime-types';
import { Readable } from 'stream';
import { URL } from 'url';
import sign from './sign';
import crypto from 'crypto';
import promisePipe from './promisePipe';

const {
  NODE_ENV,
  UNCHAINED_PUT_URL_EXPIRY,
  UNCHAINED_GRIDFS_PUT_UPLOAD_SECRET,
  ROOT_URL,
} = process.env;

const hash = (fileName: string) => {
  return crypto.createHash('sha256').update(fileName).digest('hex');
};

const getExpiryDate = () =>
  new Date(new Date().getTime() + (parseInt(UNCHAINED_PUT_URL_EXPIRY, 10) || 24 * 60 * 60 * 1000));

const createDownloadStream = (url) => {
  const { href, scheme } = new URL(url);
  return new Promise((resolve, reject) => {
    try {
      if (scheme === "http:") {
        http.get(href, resolve);
      } else {
        https.get(href, resolve);
      }
    } catch (e) {
      reject(e);
    }
  })
}

export const GridFSAdapter: IFileAdapter = {
  key: 'shop.unchained.file-upload-plugin.gridfs',
  label: 'Uploads files to Database using GridFS',
  version: '1.0',

  ...FileAdapter,

  async createSignedURL(directoryName = '', fileName) {
    const expiryDate = getExpiryDate();
    const _id = hash(`${directoryName}-${fileName}-${expiryDate.getTime()}`);
    const signature = sign(directoryName, _id, expiryDate.getTime());

    const putURL = `${ROOT_URL}gridfs/${_id}/${directoryName}/${fileName}?e=${expiryDate.getTime()}&s=${signature}`;
    const url = `${ROOT_URL}gridfs/${_id}/${directoryName}/${fileName}`;

    return {
      _id,
      directoryName,
      expiryDate,
      fileName,
      type: mimeType.lookup(fileName),
      putURL,
      url,
    };
  },

  async uploadFileFromStream(directoryName: string, rawFile: any, { modules }: any) {
    let stream;
    let fileName;
    if (rawFile instanceof Promise) {
      const { filename: f, createReadStream } = await rawFile;
      fileName = f;
      stream = createReadStream();
    } else {
      fileName = rawFile.filename;
      stream = bufferToStream(Buffer.from(rawFile.buffer, 'base64'));
    }

    const expiryDate = getExpiryDate();
    const _id = hash(`${directoryName}-${fileName}-${expiryDate.getTime()}`);

    const writeStream = await modules.gridfsFileUploads.createWriteStream(
      directoryName,
      _id,
      fileName,
    );

    const file = await promisePipe(stream, writeStream);
    const url = `${ROOT_URL}gridfs/${_id}/${directoryName}/${fileName}`;

    return {
      _id,
      directoryName,
      expiryDate: null,
      fileName,
      size: file.length,
      type: mimeType.lookup(fileName),
      url
    };
  },

  async uploadFileFromURL(directoryName: string, { fileLink, fileName: fname }: any, { modules }: any) {
    const { href } = new URL(fileLink);
    const fileName = fname || href.split('/').pop();

    const expiryDate = getExpiryDate();
    const _id = hash(`${directoryName}-${fileName}-${expiryDate.getTime()}`);

    const downloadStream = await createDownloadStream(href);

    const writeStream = await modules.gridfsFileUploads.createWriteStream(
      directoryName,
      _id,
      fileName,
    );

    const file = await promisePipe(downloadStream, writeStream);

    const url = `${ROOT_URL}gridfs/${_id}/${directoryName}/${fileName}`;

    return {
      _id,
      directoryName,
      expiryDate: null,
      fileName,
      size: file.length,
      type: mimeType.lookup(fileName),
      url
    };
  },
};

FileDirector.registerAdapter(GridFSAdapter);
