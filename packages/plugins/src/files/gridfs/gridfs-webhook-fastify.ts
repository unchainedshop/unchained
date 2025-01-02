import { pipeline } from 'node:stream/promises';
import { PassThrough } from 'node:stream';
import { FastifyRequest, RouteHandlerMethod } from 'fastify';
import { buildHashedFilename } from '@unchainedshop/file-upload';
import sign from './sign.js';
import { configureGridFSFileUploadModule } from './index.js';
import { Context } from '@unchainedshop/api';
import { createLogger } from '@unchainedshop/logger';
import { getFileAdapter } from '@unchainedshop/core-files';

const logger = createLogger('unchained:plugins:gridfs');

export const gridfsHandler: RouteHandlerMethod = async (
  req: FastifyRequest & {
    unchainedContext: Context & {
      modules: { gridfsFileUploads: ReturnType<typeof configureGridFSFileUploadModule> };
    };
  },
  res,
) => {
  try {
    const { services, modules } = req.unchainedContext;
    const { directoryName, fileName } = req.params as any;

    /* This is a file upload endpoint, and thus we need to allow CORS.
    else we'd need proxies for all kinds of things for storefronts */
    res.header('Access-Control-Allow-Methods', 'GET, PUT');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Origin', '*');

    if (req.method === 'OPTIONS') {
      res.status(200);
      return res.send();
    }

    if (req.method === 'PUT') {
      const { s: signature, e: expiryTimestamp } = req.query as Record<string, string>;
      const expiryDate = new Date(parseInt(expiryTimestamp as string, 10));
      const fileId = await buildHashedFilename(directoryName, fileName, expiryDate);
      if ((await sign(directoryName, fileId, expiryDate.getTime())) === signature) {
        const file = await modules.files.findFile({ fileId });
        if (file.expires === null) {
          res.status(400);
          return res.send('File already linked');
        }
        // If the type is octet-stream, prefer mimetype lookup from the filename
        // Else prefer the content-type header
        const type =
          req.headers['Content-Type'] === 'application/octet-stream'
            ? file.type || (req.headers['Content-Type'] as string)
            : (req.headers['Content-Type'] as string) || file.type;

        const writeStream = await modules.gridfsFileUploads.createWriteStream(
          directoryName,
          fileId,
          fileName,
          { 'content-type': type },
        );

        await pipeline(req.raw, new PassThrough(), writeStream);

        const { length } = writeStream;
        await services.files.linkFile({ fileId, size: length, type });

        res.status(200);
        return res.send();
      }

      res.status(403);
      return res.send();
    }

    if (req.method === 'GET') {
      const fileId = fileName;
      const { s: signature, e: expiryTimestamp } = req.query as Record<string, string>;
      const file = await modules.gridfsFileUploads.getFileInfo(directoryName, fileId);
      const fileDocument = await modules.files.findFile({ fileId });
      if (fileDocument?.meta?.isPrivate) {
        const expiry = parseInt(expiryTimestamp as string, 10);
        if (expiry <= Date.now()) {
          res.status(403);
          return res.send('Access restricted: Expired.');
        }

        const fileUploadAdapter = getFileAdapter();
        const signedUrl = await fileUploadAdapter.createDownloadURL(fileDocument, expiry);

        if (new URL(signedUrl, 'file://').searchParams.get('s') !== signature) {
          res.status(403);
          return res.send('Access restricted: Invalid signature.');
        }
      }
      if (file?.metadata?.['content-type']) {
        res.header('Content-Type', file.metadata['content-type']);
      }
      if (file?.length) {
        res.header('Content-Length', file?.length.toString());
      }

      const readStream = await modules.gridfsFileUploads.createReadStream(directoryName, fileId);
      res.status(200);
      return res.send(readStream);
    }

    res.status(404);
    return res.send();
  } catch (e) {
    if (e.code === 'ENOENT') {
      logger.warn(e);
      res.status(404);
      return res.send(JSON.stringify({ name: e.name, code: e.code, message: e.message }));
    } else {
      logger.warn(e);
      res.status(504);
      return res.send(JSON.stringify({ name: e.name, code: e.code, message: e.message }));
    }
  }
};
