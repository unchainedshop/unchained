import { IFileAdapter, UploadFileData } from '@unchainedshop/types/files';
import { FileAdapter, FileDirector, buildHashedFilename } from '@unchainedshop/file-upload';
import https from 'https';
import http, { OutgoingHttpHeaders } from 'http';
import mimeType from 'mime-types';
import { URL } from 'url';
import { Readable } from 'stream';
import sign from './sign';
import promisePipe from './promisePipe';

const { UNCHAINED_PUT_URL_EXPIRY, ROOT_URL } = process.env;

const getExpiryDate = () =>
  new Date(new Date().getTime() + (parseInt(UNCHAINED_PUT_URL_EXPIRY, 10) || 24 * 60 * 60 * 1000));

const bufferToStream = (buffer: any) => {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);

  return stream;
};

const createDownloadStream = (fileUrl: string, headers: OutgoingHttpHeaders): Promise<Readable> => {
  const { href, protocol } = new URL(fileUrl);
  return new Promise((resolve, reject) => {
    try {
      if (protocol === 'http:') {
        http.get(href, { headers }, resolve);
      } else {
        https.get(href, { headers }, resolve);
      }
    } catch (e) {
      reject(e);
    }
  });
};

export const GridFSAdapter: IFileAdapter = {
  key: 'shop.unchained.file-upload-plugin.gridfs',
  label: 'Uploads files to Database using GridFS',
  version: '1.0',

  ...FileAdapter,

  async createSignedURL(directoryName, fileName) {
    const expiryDate = getExpiryDate();
    const _id = buildHashedFilename(directoryName, fileName, expiryDate);
    const signature = sign(directoryName, _id, expiryDate.getTime());

    const putURL = new URL(
      `/gridfs/${directoryName}/${encodeURIComponent(
        fileName,
      )}?e=${expiryDate.getTime()}&s=${signature}`,
      ROOT_URL,
    ).href;
    const url = `/gridfs/${directoryName}/${_id}`;

    return {
      _id,
      directoryName,
      expiryDate,
      fileName,
      type: mimeType.lookup(fileName),
      putURL,
      url,
    } as UploadFileData & { putURL: string };
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
    const _id = buildHashedFilename(directoryName, fileName, expiryDate);

    const writeStream = await modules.gridfsFileUploads.createWriteStream(directoryName, _id, fileName);

    const file: any = await promisePipe(stream, writeStream);
    const url = `/gridfs/${directoryName}/${_id}`;

    return {
      _id,
      directoryName,
      expiryDate: null,
      fileName,
      size: file.length,
      type: mimeType.lookup(fileName) || (await Promise.resolve(rawFile)).mimetype,
      url,
    } as UploadFileData;
  },

  async uploadFileFromURL(
    directoryName: string,
    { fileLink, fileName: fname, headers }: any,
    { modules }: any,
  ) {
    const { href } = new URL(fileLink);
    const fileName = fname || href.split('/').pop();

    const expiryDate = getExpiryDate();
    const _id = buildHashedFilename(directoryName, fileName, expiryDate);

    const downloadStream = await createDownloadStream(href, headers);
    const writeStream = await modules.gridfsFileUploads.createWriteStream(directoryName, _id, fileName);
    const file: any = await promisePipe(downloadStream, writeStream);
    const url = `/gridfs/${directoryName}/${_id}`;

    return {
      _id,
      directoryName,
      expiryDate: null,
      fileName,
      size: file.length,
      type: mimeType.lookup(fileName),
      url,
    } as UploadFileData;
  },

  async removeFiles(files, { modules }: any) {
    await Promise.all(
      files.map(async ({ _id, path }) => modules.gridfsFileUploads.removeFileFromBucket(path, _id)),
    );
  },
};

FileDirector.registerAdapter(GridFSAdapter);
