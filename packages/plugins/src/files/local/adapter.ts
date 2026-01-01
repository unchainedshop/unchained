import { Readable, PassThrough } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import * as fs from 'node:fs';
import * as path from 'node:path';
import mime from 'mime/lite';
import {
  FileAdapter,
  FileDirector,
  buildHashedFilename,
  resolveExpirationDate,
  type IFileAdapter,
} from '@unchainedshop/file-upload';
import { type UploadFileData } from '@unchainedshop/file-upload';
import sign from './sign.ts';
import { filesSettings } from '@unchainedshop/core-files';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:local-files');

const { LOCAL_FILES_PUT_SERVER_PATH = '/files', LOCAL_FILES_STORAGE_PATH = './uploads' } = process.env;

// Ensure storage directory exists
const ensureStorageDir = (directoryName: string) => {
  const storagePath = path.join(LOCAL_FILES_STORAGE_PATH, directoryName);
  if (!fs.existsSync(storagePath)) {
    fs.mkdirSync(storagePath, { recursive: true });
  }
  return storagePath;
};

const getFilePath = (directoryName: string, fileName: string) => {
  return path.join(LOCAL_FILES_STORAGE_PATH, directoryName, fileName);
};

const bufferToStream = (buffer: Buffer) => {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
};

export const LocalFilesAdapter: IFileAdapter = {
  key: 'shop.unchained.file-upload-plugin.local',
  label: 'Uploads files to local filesystem',
  version: '1.0.0',

  ...FileAdapter,

  async createDownloadURL(file, expiry) {
    // If public, just return the stored path from the db
    if (!file?.meta?.isPrivate) return file?.url || null;

    const expiryTimestamp =
      expiry ||
      new Date(new Date().getTime() + (filesSettings?.privateFileSharingMaxAge || 0)).getTime();

    const signature = await sign(file.path, file._id, expiryTimestamp);
    return `${file.url}?s=${signature}&e=${expiryTimestamp}`;
  },

  async createSignedURL(directoryName, fileName) {
    const expiryDate = resolveExpirationDate();
    const hashedFilename = await buildHashedFilename(directoryName, fileName, expiryDate);
    // Sign with the hashedFilename (which is the same as the file ID and storage name)
    const signature = await sign(directoryName, hashedFilename, expiryDate.getTime());

    // Both putURL and url use hashedFilename for consistency
    const encodedHashedFilename = encodeURIComponent(hashedFilename);
    const putURL = new URL(
      `${LOCAL_FILES_PUT_SERVER_PATH}/${directoryName}/${encodedHashedFilename}?e=${expiryDate.getTime()}&s=${signature}`,
      process.env.ROOT_URL,
    ).href;
    const url = `${LOCAL_FILES_PUT_SERVER_PATH}/${directoryName}/${encodedHashedFilename}`;

    return {
      _id: hashedFilename,
      directoryName,
      expiryDate,
      fileName,
      type: mime.getType(fileName),
      putURL,
      url,
    } as UploadFileData & { putURL: string };
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async uploadFileFromStream(directoryName: string, rawFile: any, _context) {
    let stream: Readable;
    let fileName: string;
    let fileId: string | undefined;

    if (rawFile instanceof Promise) {
      const { filename: f, createReadStream, fileId: forcedFileId } = await rawFile;
      fileName = decodeURIComponent(f);
      stream = createReadStream();
      fileId = forcedFileId;
    } else {
      fileName = decodeURIComponent(rawFile.filename);
      stream = bufferToStream(Buffer.from(rawFile.buffer, 'base64'));
      fileId = rawFile.fileId;
    }

    const expiryDate = resolveExpirationDate();
    const hashedFilename = await buildHashedFilename(directoryName, fileName, expiryDate);
    const type = mime.getType(fileName) || (await Promise.resolve(rawFile)).mimetype;

    ensureStorageDir(directoryName);
    const filePath = getFilePath(directoryName, fileId || hashedFilename);
    const writeStream = fs.createWriteStream(filePath);

    await pipeline(
      stream,
      new PassThrough({ highWaterMark: 1024 * 1024 * 4 }), // 4MB Buffer
      writeStream,
    );

    const stats = fs.statSync(filePath);
    const url = `${LOCAL_FILES_PUT_SERVER_PATH}/${directoryName}/${encodeURIComponent(hashedFilename)}`;

    return {
      _id: fileId || hashedFilename,
      directoryName,
      expiryDate: null,
      fileName,
      size: stats.size,
      type,
      url,
    } as UploadFileData;
  },

  async uploadFileFromURL(directoryName: string, { fileLink, fileName: fname, fileId, headers }: any) {
    // URL is pre-validated at service level (uploadFileFromURLService)
    const url = new URL(fileLink);
    const fileName = decodeURIComponent(fname || url.href.split('/').pop());

    const expiryDate = resolveExpirationDate();
    const hashedFilename = await buildHashedFilename(directoryName, fileName, expiryDate);

    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error(`Unexpected response for ${url.href}: ${response.statusText}`);
    const type = mime.getType(fileName) || response.headers.get('content-type');

    ensureStorageDir(directoryName);
    const filePath = getFilePath(directoryName, fileId || hashedFilename);
    const writeStream = fs.createWriteStream(filePath);

    await pipeline(Readable.fromWeb(response.body as any), new PassThrough(), writeStream);

    const stats = fs.statSync(filePath);
    const fileUrl = `${LOCAL_FILES_PUT_SERVER_PATH}/${directoryName}/${encodeURIComponent(hashedFilename)}`;

    return {
      _id: fileId || hashedFilename,
      directoryName,
      expiryDate: null,
      fileName,
      size: stats.size,
      type,
      url: fileUrl,
    } as UploadFileData;
  },

  async createDownloadStream(file) {
    const filePath = getFilePath(file.path, file._id);
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    return fs.createReadStream(filePath);
  },

  async removeFiles(files) {
    await Promise.all(
      files.map(async ({ _id, path: dirPath }) => {
        const filePath = getFilePath(dirPath, _id);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          logger.debug(`Removed file: ${filePath}`);
        }
      }),
    );
  },
};

FileDirector.registerAdapter(LocalFilesAdapter);
