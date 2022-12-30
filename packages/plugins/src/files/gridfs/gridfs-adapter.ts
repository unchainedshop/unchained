/// <reference lib="dom" />
import { IFileAdapter, UploadFileData } from '@unchainedshop/types/files.js';
import { FileAdapter, FileDirector, buildHashedFilename } from '@unchainedshop/file-upload';
import mimeType from 'mime-types';
import { URL } from 'url';
import { Readable, pipeline as rawPipeline } from 'stream';
import { promisify } from 'util';
import { ReadableStream } from 'node:stream/web';
import sign from './sign';

const pipeline = promisify(rawPipeline);

const { UNCHAINED_PUT_URL_EXPIRY, ROOT_URL } = process.env;

const getExpiryDate = () =>
  new Date(new Date().getTime() + (parseInt(UNCHAINED_PUT_URL_EXPIRY, 10) || 24 * 60 * 60 * 1000));

const bufferToStream = (buffer: any) => {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);

  return stream;
};

export const GridFSAdapter: IFileAdapter = {
  key: 'shop.unchained.file-upload-plugin.gridfs',
  label: 'Uploads files to Database using GridFS',
  version: '1.0.0',

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
    await pipeline(stream, writeStream);
    const { length } = writeStream;
    const url = `/gridfs/${directoryName}/${_id}`;

    return {
      _id,
      directoryName,
      expiryDate: null,
      fileName,
      size: length,
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

    const writeStream = await modules.gridfsFileUploads.createWriteStream(directoryName, _id, fileName);
    const response = await fetch(href, { headers });
    if (!response.ok) throw new Error(`Unexpected response for ${href}: ${response.statusText}`);
    await pipeline(response.body as ReadableStream, writeStream);
    const { length } = writeStream;
    const url = `/gridfs/${directoryName}/${_id}`;

    return {
      _id,
      directoryName,
      expiryDate: null,
      fileName,
      size: length,
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
