import { pipeline } from 'node:stream/promises';
import { PassThrough } from 'node:stream';
import { FastifyRequest, RouteHandlerMethod } from 'fastify';
import { buildHashedFilename } from '@unchainedshop/file-upload';
import sign from './sign.js';
import { GridFSFileUploadsModule } from './module.js';
import { Context } from '@unchainedshop/api';
import { createLogger } from '@unchainedshop/logger';
import { getFileAdapter } from '@unchainedshop/core-files';

const logger = createLogger('unchained:plugins:gridfs');

const gridfsHandler: RouteHandlerMethod = async (
  req: FastifyRequest & {
    unchainedContext: Context & {
      modules: GridFSFileUploadsModule;
    };
  },
  reply,
) => {
  try {
    const { services, modules } = req.unchainedContext;
    const { directoryName, fileName } = req.params as any;

    /* This is a file upload endpoint, and thus we need to allow CORS.
    else we'd need proxies for all kinds of things for storefronts */
    reply.header('Access-Control-Allow-Methods', 'GET, PUT');
    reply.header('Access-Control-Allow-Headers', 'content-type');
    reply.header('Access-Control-Allow-Origin', '*');

    if (req.method === 'OPTIONS') {
      reply.status(200);
      return reply.send();
    }

    if (req.method === 'PUT') {
      const { s: signature, e: expiryTimestamp } = req.query as Record<string, string>;
      const expiryDate = new Date(parseInt(expiryTimestamp as string, 10));
      const fileId = await buildHashedFilename(directoryName, fileName, expiryDate);
      if ((await sign(directoryName, fileId, expiryDate.getTime())) === signature) {
        const file = await modules.files.findFile({ fileId });
        if (file.expires === null) {
          reply.status(400);
          return reply.send('File already linked');
        }
        // If the type is octet-stream, prefer mimetype lookup from the filename
        // Else prefer the content-type header
        const type =
          req.headers['content-type'] === 'application/octet-stream'
            ? file.type || (req.headers['content-type'] as string)
            : (req.headers['content-type'] as string) || file.type;

        const writeStream = await modules.gridfsFileUploads.createWriteStream(
          directoryName,
          fileId,
          fileName,
          {
            metadata: { 'content-type': type },
          },
        );

        await pipeline(
          req.raw,
          new PassThrough({ allowHalfOpen: true, highWaterMark: 1024 * 1024 }),
          writeStream,
        );

        const { length } = writeStream;
        await services.files.linkFile({ fileId, size: length, type });

        reply.status(200);
        return reply.send();
      }

      reply.status(403);
      return reply.send();
    }

    if (req.method === 'GET') {
      const fileId = fileName;
      const { s: signature, e: expiryTimestamp } = req.query as Record<string, string>;
      const file = await modules.gridfsFileUploads.getFileInfo(directoryName, fileId);
      const fileDocument = await modules.files.findFile({ fileId });
      if (fileDocument?.meta?.isPrivate) {
        const expiry = parseInt(expiryTimestamp as string, 10);
        if (expiry <= Date.now()) {
          reply.status(403);
          return reply.send('Access restricted: Expired.');
        }

        const fileUploadAdapter = getFileAdapter();
        const signedUrl = await fileUploadAdapter.createDownloadURL(fileDocument, expiry);

        if (new URL(signedUrl, 'file://').searchParams.get('s') !== signature) {
          reply.status(403);
          return reply.send('Access restricted: Invalid signature.');
        }
      }

      if (file?.metadata?.['content-type']) {
        reply.header('content-type', file.metadata['content-type']);
      }
      if (file?.length) {
        reply.header('content-length', file?.length.toString());
      }

      const readStream = await modules.gridfsFileUploads.createReadStream(directoryName, fileId);

      reply.status(200);
      return reply.send(readStream);
    }

    reply.status(404);
    return reply.send();
  } catch (e) {
    if (e.code === 'ENOENT') {
      logger.warn(e);
      reply.status(404);
      return reply.send({ name: e.name, code: e.code, message: e.message });
    } else {
      logger.warn(e);
      reply.status(504);
      return reply.send({ name: e.name, code: e.code, message: e.message });
    }
  }
};

export default gridfsHandler;
