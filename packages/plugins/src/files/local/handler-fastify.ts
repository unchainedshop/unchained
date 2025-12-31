import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as fs from 'node:fs';
import * as path from 'node:path';
import mime from 'mime/lite';
import { verify } from './sign.ts';
import { createLogger } from '@unchainedshop/logger';
import type { Context } from '@unchainedshop/api';
import { getFileAdapter } from '@unchainedshop/core-files';

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

type RequestWithContext = FastifyRequest<{ Params: LocalFilesParams; Querystring: LocalFilesQuery }> & {
  unchainedContext?: Context;
};

const getHandler = async (request: RequestWithContext, reply: FastifyReply) => {
  const { directoryName, fileName } = request.params;
  const { s: signature, e: expiryStr } = request.query;
  const { modules } = request.unchainedContext || {};

  /* This is a file upload endpoint, and thus we need to allow CORS.
  else we'd need proxies for all kinds of things for storefronts */
  reply.header('Access-Control-Allow-Methods', 'GET, PUT');
  reply.header('Access-Control-Allow-Headers', 'Content-Type');
  reply.header('Access-Control-Allow-Origin', '*');

  const fileId = decodeURIComponent(fileName);
  const filePath = getFilePath(directoryName, fileId);

  // Check if file is private in database - look up by fileId since URLs may vary
  const fileDocument = modules ? await modules.files.findFile({ fileId }) : null;

  if (fileDocument?.meta?.isPrivate) {
    const expiry = parseInt(expiryStr as string, 10);
    if (!expiry || expiry <= Date.now()) {
      return reply.status(403).send('Access restricted: Expired.');
    }

    const fileUploadAdapter = getFileAdapter();
    const signedUrl = await fileUploadAdapter.createDownloadURL(fileDocument, expiry);

    if (!signedUrl || new URL(signedUrl, 'file://').searchParams.get('s') !== signature) {
      return reply.status(403).send('Access restricted: Invalid signature.');
    }
  } else if (!fileDocument && modules) {
    // File not in database and we have modules - check if file exists on disk
    if (!fs.existsSync(filePath)) {
      return reply.status(404).send('File not found');
    }
  } else if (!fs.existsSync(filePath)) {
    return reply.status(404).send('File not found');
  }

  const stats = fs.statSync(filePath);
  const mimeType = mime.getType(fileName) || 'application/octet-stream';

  reply.header('Content-Type', mimeType);
  reply.header('Content-Length', stats.size);
  reply.header('Cache-Control', 'public, max-age=31536000');

  const readStream = fs.createReadStream(filePath);
  return reply.send(readStream);
};

const putHandler = async (request: RequestWithContext, reply: FastifyReply) => {
  const { directoryName, fileName } = request.params;
  const { s: signature, e: expiryStr } = request.query;
  const { services, modules } = request.unchainedContext || {};

  /* This is a file upload endpoint, and thus we need to allow CORS.
  else we'd need proxies for all kinds of things for storefronts */
  reply.header('Access-Control-Allow-Methods', 'GET, PUT');
  reply.header('Access-Control-Allow-Headers', 'Content-Type');
  reply.header('Access-Control-Allow-Origin', '*');

  if (!signature || !expiryStr) {
    return reply.status(400).send('Missing signature or expiry');
  }

  const expiryTimestamp = parseInt(expiryStr, 10);
  const isValid = await verify(directoryName, fileName, expiryTimestamp, signature);

  if (!isValid) {
    return reply.status(403).send('Invalid or expired signature');
  }

  // Check that file exists in database (was prepared)
  const fileId = decodeURIComponent(fileName);
  const file = modules ? await modules.files.findFile({ fileId }) : null;

  if (!file) {
    return reply.status(404).send('File not found');
  }

  if (file.expires === null) {
    return reply.status(400).send('File already linked');
  }

  ensureStorageDir(directoryName);
  const filePath = getFilePath(directoryName, fileId);

  // If the type is octet-stream, prefer mimetype lookup from the filename
  // Else prefer the content-type header
  const contentType = request.headers['content-type'];
  const type =
    contentType === 'application/octet-stream' ? file.type || contentType : contentType || file.type;

  return new Promise<void>((resolve, reject) => {
    const writeStream = fs.createWriteStream(filePath);

    request.raw.pipe(writeStream);

    writeStream.on('finish', async () => {
      logger.debug(`File uploaded: ${filePath}`);

      // Get file size and link the file (triggers callback for assortment-media, product-media, etc.)
      const stats = fs.statSync(filePath);
      if (services) {
        await services.files.linkFile({ fileId, size: stats.size, type });
      }

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

const optionsHandler = async (_request: RequestWithContext, reply: FastifyReply) => {
  reply.header('Access-Control-Allow-Methods', 'GET, PUT');
  reply.header('Access-Control-Allow-Headers', 'Content-Type');
  reply.header('Access-Control-Allow-Origin', '*');
  return reply.status(200).send();
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

  fastify.options<{ Params: LocalFilesParams; Querystring: LocalFilesQuery }>(
    `${LOCAL_FILES_PUT_SERVER_PATH}/:directoryName/:fileName`,
    optionsHandler,
  );
};

export default connectLocalFilesFastify;
