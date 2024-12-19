import { Readable, PassThrough } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import mimeType from 'mime-types';
import {
  FileAdapter,
  FileDirector,
  buildHashedFilename,
  resolveExpirationDate,
  IFileAdapter,
} from '@unchainedshop/file-upload';
import { UploadFileData } from '@unchainedshop/file-upload';
import sign from './sign.js';
import { filesSettings } from '@unchainedshop/core-files';
import { UnchainedCore } from '@unchainedshop/core';
import { GridFSFileUploadsModule } from './index.js';

const { ROOT_URL } = process.env;

const bufferToStream = (buffer: any) => {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);

  return stream;
};

export const GridFSAdapter: IFileAdapter<
  UnchainedCore & {
    modules: {
      gridfsFileUploads: GridFSFileUploadsModule;
    };
  }
> = {
  key: 'shop.unchained.file-upload-plugin.gridfs',
  label: 'Uploads files to Database using GridFS',
  version: '1.0.0',

  ...FileAdapter,
  async createDownloadURL(file, expiry) {
    // If public, just return the stored path from the db
    if (!file.meta?.isPrivate) return file?.url;

    const expiryTimestamp =
      expiry ||
      new Date(new Date().getTime() + (filesSettings?.privateFileSharingMaxAge || 0)).getTime();

    const signature = await sign(file.path, file._id, expiryTimestamp);
    return `${file.url}?s=${signature}&e=${expiryTimestamp}`;
  },
  async createSignedURL(directoryName, fileName) {
    const expiryDate = resolveExpirationDate();
    const hashedFilename = await buildHashedFilename(directoryName, fileName, expiryDate);
    const signature = await sign(directoryName, hashedFilename, expiryDate.getTime());

    const putURL = new URL(
      `/gridfs/${directoryName}/${encodeURIComponent(
        fileName,
      )}?e=${expiryDate.getTime()}&s=${signature}`,
      ROOT_URL,
    ).href;
    const url = `/gridfs/${directoryName}/${hashedFilename}`;

    return {
      _id: hashedFilename,
      directoryName,
      expiryDate,
      fileName,
      type: mimeType.lookup(fileName),
      putURL,
      url,
    } as UploadFileData & { putURL: string };
  },

  async uploadFileFromStream(directoryName: string, rawFile: any, { modules }) {
    let stream: Readable;
    let fileName;
    if (rawFile instanceof Promise) {
      const { filename: f, createReadStream } = await rawFile;
      fileName = decodeURIComponent(f);
      stream = createReadStream();
    } else {
      fileName = decodeURIComponent(rawFile.filename);
      stream = bufferToStream(Buffer.from(rawFile.buffer, 'base64'));
    }

    const expiryDate = resolveExpirationDate();
    const hashedFilename = await buildHashedFilename(directoryName, fileName, expiryDate);
    const type = mimeType.lookup(fileName) || (await Promise.resolve(rawFile)).mimetype;

    const writeStream = await modules.gridfsFileUploads.createWriteStream(
      directoryName,
      hashedFilename,
      fileName,
      { 'content-type': type },
    );
    await pipeline(stream, new PassThrough({ allowHalfOpen: true }), writeStream);
    const { length } = writeStream;
    const url = `/gridfs/${directoryName}/${encodeURIComponent(hashedFilename)}`;

    return {
      _id: hashedFilename,
      directoryName,
      expiryDate: null,
      fileName,
      size: length,
      type,
      url,
    } as UploadFileData;
  },

  async uploadFileFromURL(
    directoryName: string,
    { fileLink, fileName: fname, fileId, headers }: any,
    { modules },
  ) {
    const { href } = new URL(fileLink);
    const fileName = decodeURIComponent(fname || href.split('/').pop());

    const expiryDate = resolveExpirationDate();
    const hashedFilename = await buildHashedFilename(directoryName, fileName, expiryDate);

    const response = await fetch(href, { headers });
    if (!response.ok) throw new Error(`Unexpected response for ${href}: ${response.statusText}`);
    const type = mimeType.lookup(fileName) || response.headers.get('content-type');

    const writeStream = await modules.gridfsFileUploads.createWriteStream(
      directoryName,
      hashedFilename,
      fileName,
      { 'content-type': type },
    );
    await pipeline(response.body as unknown as Readable, new PassThrough(), writeStream);
    const { length } = writeStream;
    const url = `/gridfs/${directoryName}/${encodeURIComponent(hashedFilename)}`;

    return {
      _id: fileId || hashedFilename,
      directoryName,
      expiryDate: null,
      fileName,
      size: length,
      type,
      url,
    } as UploadFileData;
  },

  async createDownloadStream(file, { modules }: any) {
    const readStream = await modules.gridfsFileUploads.createReadStream(file.path, file._id);
    return readStream;
  },

  async removeFiles(files, { modules }: any) {
    await Promise.all(
      files.map(async ({ _id, path }) => modules.gridfsFileUploads.removeFileFromBucket(path, _id)),
    );
  },
};

FileDirector.registerAdapter(GridFSAdapter);
