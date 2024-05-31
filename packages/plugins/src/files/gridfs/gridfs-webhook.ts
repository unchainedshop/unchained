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
    const [, directoryNameRaw, fileNameRaw] = url.pathname.split('/');
    const directoryName = decodeURIComponent(directoryNameRaw);
    const fileName = decodeURIComponent(fileNameRaw);

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

        // If the type is octet-stream, prefer mimetype lookup from the filename
        // Else prefer the content-type header
        const type =
          req.header('Content-Type') === 'application/octet-stream'
            ? file.type || req.header('Content-Type')
            : req.header('Content-Type') || file.type;

        const writeStream = await modules.gridfsFileUploads.createWriteStream(
          directoryName,
          fileId,
          fileName,
          { 'content-type': type },
        );
        await pipeline(req, new PassThrough(), writeStream);

        const { length } = writeStream;
        await services.files.linkFile({ fileId, size: length, type }, req.unchainedContext);

        res.statusCode = 200;
        res.end();
        return;
      }
      res.statusCode = 403;
      res.end();
      return;
    }

    if (req.method === 'GET') {
      const fileId = fileName;

      const file = await modules.gridfsFileUploads.getFileInfo(directoryName, fileId);
      if (file?.metadata?.['content-type']) {
        res.setHeader('Content-Type', file.metadata['content-type']);
      }
      if (file?.length) {
        res.setHeader('Content-Length', file?.length.toString());
      }

      const readStream = await modules.gridfsFileUploads.createReadStream(directoryName, fileId);
      readStream.pipe(res, { end: false });
      await finished(readStream);
      res.statusCode = 200;
      res.end();
      return;
    }
    res.statusCode = 404;
    res.end();
  } catch (e) {
    if (e.code === 'ENOENT') {
      log(e.message, { level: LogLevel.Warning });
      res.statusCode = 404;
      res.end(e.message);
    } else {
      log(e.message, { level: LogLevel.Error });
      res.statusCode = 503;
      res.end(JSON.stringify({ name: e.name, code: e.code, message: e.message }));
    }
  }
};
