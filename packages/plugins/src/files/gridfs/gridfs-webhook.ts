import { pipeline, finished } from 'stream/promises';
import { PassThrough } from 'stream';
import { log, LogLevel } from '@unchainedshop/logger';
import { buildHashedFilename } from '@unchainedshop/file-upload';
import { Context } from '@unchainedshop/types/api.js';
import express from 'express';
import sign from './sign.js';
import { configureGridFSFileUploadModule } from './index.js';

const { ROOT_URL } = process.env;

export const gridfsHandler = async (
  req: express.Request & {
    unchainedContext: Context & {
      modules: { gridfsFileUploads: ReturnType<typeof configureGridFSFileUploadModule> };
    };
  },
  res: express.Response,
) => {
  try {
    const { services, modules } = req.unchainedContext;
    const url = new URL(req.url, ROOT_URL);
    const [, directoryName, fileName] = url.pathname.split('/');

    /* This is a file upload endpoint, and thus we need to allow CORS.
    else we'd need proxies for all kinds of things for storefronts */
    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (req.method === 'OPTIONS') {
      res.statusCode = 200;
      res.end();
      return;
    }

    if (req.method === 'PUT') {
      const { s: signature, e: expiryTimestamp } = req.query;
      const expiryDate = new Date(parseInt(expiryTimestamp as string, 10));
      const fileId = buildHashedFilename(directoryName, fileName, expiryDate);
      if (sign(directoryName, fileId, expiryDate.getTime()) === signature) {
        const file = await modules.files.findFile({ fileId });
        if (file.expires === null) {
          res.statusCode = 400;
          res.end('File already linked');
          return;
        }
        const writeStream = await modules.gridfsFileUploads.createWriteStream(
          directoryName,
          fileId,
          fileName,
        );
        await pipeline(req, new PassThrough(), writeStream);

        const { length } = writeStream;
        res.statusCode = 200;
        await services.files.linkFile(
          { fileId, size: length, type: req.header('Content-Type') },
          req.unchainedContext,
        );
        res.end();
        return;
      }
      res.statusCode = 403;
      res.end();
      return;
    }

    if (req.method === 'GET') {
      const fileId = fileName;
      const readStream = await modules.gridfsFileUploads.createReadStream(directoryName, fileId);
      res.statusCode = 200;
      readStream.pipe(res, { end: false });
      await finished(readStream);
      res.end();
      return;
    }
    res.statusCode = 404;
    res.end();
  } catch (e) {
    log(e.message, { level: LogLevel.Error });
    if (e.code === 'ENOENT') {
      res.statusCode = 404;
      res.end();
    } else {
      res.statusCode = 503;
      res.end(JSON.stringify({ name: e.name, code: e.code, message: e.message }));
    }
  }
};
