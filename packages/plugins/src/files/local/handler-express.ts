import type { Request, Response, NextFunction, Router } from 'express';
import express from 'express';
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

const localFilesHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { directoryName, fileName } = req.params;
    const { s: signature, e: expiryStr } = req.query as { s?: string; e?: string };

    // For PUT requests (uploads), verify signature
    if (req.method === 'PUT') {
      if (!signature || !expiryStr) {
        return res.status(400).send('Missing signature or expiry');
      }

      const expiryTimestamp = parseInt(expiryStr, 10);
      const isValid = await verify(directoryName, fileName, expiryTimestamp, signature);

      if (!isValid) {
        return res.status(403).send('Invalid or expired signature');
      }

      ensureStorageDir(directoryName);
      const filePath = getFilePath(directoryName, fileName);
      const writeStream = fs.createWriteStream(filePath);

      req.pipe(writeStream);
      writeStream.on('finish', () => {
        logger.debug(`File uploaded: ${filePath}`);
        res.status(200).send('OK');
      });
      writeStream.on('error', (err) => {
        logger.error(`Error uploading file: ${err.message}`);
        res.status(500).send('Upload failed');
      });
      return;
    }

    // For GET requests (downloads)
    const filePath = getFilePath(directoryName, decodeURIComponent(fileName));

    if (!fs.existsSync(filePath)) {
      return res.status(404).send('File not found');
    }

    // If signature is provided, verify it (for private files)
    if (signature && expiryStr) {
      const expiryTimestamp = parseInt(expiryStr, 10);
      const isValid = await verify(directoryName, fileName, expiryTimestamp, signature);

      if (!isValid) {
        return res.status(403).send('Invalid or expired signature');
      }
    }

    const stats = fs.statSync(filePath);
    const mimeType = mime.getType(fileName) || 'application/octet-stream';

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Cache-Control', 'public, max-age=31536000');

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  } catch (error) {
    logger.error(`Error in local files handler: ${(error as Error).message}`);
    next(error);
  }
};

export const createLocalFilesMiddleware = (): Router => {
  const router = express.Router();

  router.get('/:directoryName/:fileName', localFilesHandler);
  router.put('/:directoryName/:fileName', localFilesHandler);

  return router;
};

export const connectLocalFilesExpress = (app: express.Express) => {
  app.use(LOCAL_FILES_PUT_SERVER_PATH, createLocalFilesMiddleware());
};

export default createLocalFilesMiddleware;
