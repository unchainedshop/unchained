/// <reference lib="dom" />
import { URL } from 'url';
import { Readable, PassThrough } from 'stream';
import { pipeline } from 'stream/promises';
import mimeType from 'mime-types';
import {
  FileAdapter,
  FileDirector,
  buildHashedFilename,
  resolveExpirationDate,
} from '@unchainedshop/file-upload';
import { IFileAdapter, UploadFileData } from '@unchainedshop/types/files.js';
import sign from './sign.js';

const { ROOT_URL } = process.env;

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
    const expiryDate = resolveExpirationDate();
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

    const expiryDate = resolveExpirationDate();
    const _id = buildHashedFilename(directoryName, fileName, expiryDate);

    const writeStream = await modules.gridfsFileUploads.createWriteStream(directoryName, _id, fileName);
    await pipeline(stream, new PassThrough({ allowHalfOpen: true }), writeStream);
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

    const expiryDate = resolveExpirationDate();
    const _id = buildHashedFilename(directoryName, fileName, expiryDate);

    const writeStream = await modules.gridfsFileUploads.createWriteStream(directoryName, _id, fileName);
    const response = await fetch(href, { headers });
    if (!response.ok) throw new Error(`Unexpected response for ${href}: ${response.statusText}`);
    await pipeline(response.body as unknown as Readable, new PassThrough(), writeStream);
    const { length } = writeStream;
    const url = `/gridfs/${directoryName}/${_id}`;

    return {
      _id,
      directoryName,
      expiryDate: null,
      fileName,
      size: length,
      type: mimeType.lookup(fileName) || response.headers.get('content-type'),
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
