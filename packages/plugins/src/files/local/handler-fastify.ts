import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as fs from 'node:fs';
import * as path from 'node:path';
import mime from 'mime/lite';
import { verify } from './sign.ts';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:local-files');

const { LOCAL_FILES_PUT_SERVER_PATH = '/files', LOCAL_FILES_STORAGE_PATH = './uploads' } = process.env;

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

interface LocalFilesParams {
  directoryName: string;
  fileName: string;
}

interface LocalFilesQuery {
  s?: string;
  e?: string;
}

const getHandler = async (
  request: FastifyRequest<{ Params: LocalFilesParams; Querystring: LocalFilesQuery }>,
  reply: FastifyReply,
) => {
  const { directoryName, fileName } = request.params;
  const { s: signature, e: expiryStr } = request.query;

  const filePath = getFilePath(directoryName, decodeURIComponent(fileName));

  if (!fs.existsSync(filePath)) {
    return reply.status(404).send('File not found');
  }

  // If signature is provided, verify it (for private files)
  if (signature && expiryStr) {
    const expiryTimestamp = parseInt(expiryStr, 10);
    const isValid = await verify(directoryName, fileName, expiryTimestamp, signature);

    if (!isValid) {
      return reply.status(403).send('Invalid or expired signature');
    }
  }

  const stats = fs.statSync(filePath);
  const mimeType = mime.getType(fileName) || 'application/octet-stream';

  reply.header('Content-Type', mimeType);
  reply.header('Content-Length', stats.size);
  reply.header('Cache-Control', 'public, max-age=31536000');

  const readStream = fs.createReadStream(filePath);
  return reply.send(readStream);
};

const putHandler = async (
  request: FastifyRequest<{ Params: LocalFilesParams; Querystring: LocalFilesQuery }>,
  reply: FastifyReply,
) => {
  const { directoryName, fileName } = request.params;
  const { s: signature, e: expiryStr } = request.query;

  if (!signature || !expiryStr) {
    return reply.status(400).send('Missing signature or expiry');
  }

  const expiryTimestamp = parseInt(expiryStr, 10);
  const isValid = await verify(directoryName, fileName, expiryTimestamp, signature);

  if (!isValid) {
    return reply.status(403).send('Invalid or expired signature');
  }

  ensureStorageDir(directoryName);
  const filePath = getFilePath(directoryName, fileName);

  return new Promise<void>((resolve, reject) => {
    const writeStream = fs.createWriteStream(filePath);

    request.raw.pipe(writeStream);

    writeStream.on('finish', () => {
      logger.debug(`File uploaded: ${filePath}`);
      reply.status(200).send('OK');
      resolve();
    });

    writeStream.on('error', (err) => {
      logger.error(`Error uploading file: ${err.message}`);
      reply.status(500).send('Upload failed');
      reject(err);
    });
  });
};

export const connectLocalFilesFastify = (fastify: FastifyInstance) => {
  // Register a raw content type parser to handle any file uploads
  fastify.addContentTypeParser('*', (_request, payload, done) => {
    done(null, payload);
  });

  fastify.get<{ Params: LocalFilesParams; Querystring: LocalFilesQuery }>(
    `${LOCAL_FILES_PUT_SERVER_PATH}/:directoryName/:fileName`,
    getHandler,
  );

  fastify.put<{ Params: LocalFilesParams; Querystring: LocalFilesQuery }>(
    `${LOCAL_FILES_PUT_SERVER_PATH}/:directoryName/:fileName`,
    putHandler,
  );
};

export default connectLocalFilesFastify;
