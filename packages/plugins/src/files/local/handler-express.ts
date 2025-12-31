import type { Request, Response, NextFunction, Router } from 'express';
import express from 'express';
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

type RequestWithContext = Request & {
  unchainedContext?: Context;
};

const localFilesHandler = async (req: RequestWithContext, res: Response, next: NextFunction) => {
  try {
    const { directoryName, fileName } = req.params;
    const { s: signature, e: expiryStr } = req.query as { s?: string; e?: string };
    const { services, modules } = req.unchainedContext || {};

    /* This is a file upload endpoint, and thus we need to allow CORS.
    else we'd need proxies for all kinds of things for storefronts */
    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    // For PUT requests (uploads), verify signature and link file
    if (req.method === 'PUT') {
      if (!signature || !expiryStr) {
        return res.status(400).send('Missing signature or expiry');
      }

      const expiryTimestamp = parseInt(expiryStr, 10);
      const isValid = await verify(directoryName, fileName, expiryTimestamp, signature);

      if (!isValid) {
        return res.status(403).send('Invalid or expired signature');
      }

      // Check that file exists in database (was prepared)
      const fileId = decodeURIComponent(fileName);
      const file = modules ? await modules.files.findFile({ fileId }) : null;

      if (!file) {
        return res.status(404).send('File not found');
      }

      if (file.expires === null) {
        return res.status(400).send('File already linked');
      }

      ensureStorageDir(directoryName);
      const filePath = getFilePath(directoryName, fileId);
      const writeStream = fs.createWriteStream(filePath);

      // If the type is octet-stream, prefer mimetype lookup from the filename
      // Else prefer the content-type header
      const type =
        req.header('Content-Type') === 'application/octet-stream'
          ? file.type || req.header('Content-Type')
          : req.header('Content-Type') || file.type;

      req.pipe(writeStream);
      writeStream.on('finish', async () => {
        logger.debug(`File uploaded: ${filePath}`);

        // Get file size and link the file (triggers callback for assortment-media, product-media, etc.)
        const stats = fs.statSync(filePath);
        if (services) {
          await services.files.linkFile({ fileId, size: stats.size, type });
        }

        res.status(200).end();
      });
      writeStream.on('error', (err) => {
        logger.error(`Error uploading file: ${err.message}`);
        res.status(500).send('Upload failed');
      });
      return;
    }

    // For GET requests (downloads)
    const fileId = decodeURIComponent(fileName);
    const filePath = getFilePath(directoryName, fileId);

    // Check if file is private in database - look up by fileId since URLs may vary
    const fileDocument = modules ? await modules.files.findFile({ fileId }) : null;

    if (fileDocument?.meta?.isPrivate) {
      const expiry = parseInt(expiryStr as string, 10);
      if (!expiry || expiry <= Date.now()) {
        return res.status(403).send('Access restricted: Expired.');
      }

      const fileUploadAdapter = getFileAdapter();
      const signedUrl = await fileUploadAdapter.createDownloadURL(fileDocument, expiry);

      if (!signedUrl || new URL(signedUrl, 'file://').searchParams.get('s') !== signature) {
        return res.status(403).send('Access restricted: Invalid signature.');
      }
    } else if (!fileDocument && modules) {
      // File not in database and we have modules - check if file exists on disk
      if (!fs.existsSync(filePath)) {
        return res.status(404).send('File not found');
      }
    } else if (!fs.existsSync(filePath)) {
      return res.status(404).send('File not found');
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
  router.options('/:directoryName/:fileName', localFilesHandler);

  return router;
};

export const connectLocalFilesExpress = (app: express.Express) => {
  app.use(LOCAL_FILES_PUT_SERVER_PATH, createLocalFilesMiddleware());
};

export default createLocalFilesMiddleware;
