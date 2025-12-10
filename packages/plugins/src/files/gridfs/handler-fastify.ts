import { finished, pipeline } from 'node:stream/promises';
import { PassThrough } from 'node:stream';
import { type FastifyRequest, type RouteHandlerMethod } from 'fastify';
import { buildHashedFilename } from '@unchainedshop/file-upload';
import sign from './sign.ts';
import { type GridFSFileUploadsModule } from './module.ts';
import { type Context } from '@unchainedshop/api';
import { createLogger } from '@unchainedshop/logger';
import { getFileAdapter } from '@unchainedshop/core-files';

const logger = createLogger('unchained:gridfs');

const { GRIDFS_PUT_SERVER_PATH = '/gridfs' } = process.env;

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

        if (!file) {
          reply.status(404);
          logger.error('File not found', { fileId });
          return reply.send({
            success: false,
            message: 'File not found',
            name: 'FILE_NOT_FOUND',
          });
        }

        if (file.expires === null) {
          reply.status(400);
          logger.error('File already linked', { fileId });
          return reply.send({
            success: false,
            message: 'File already linked',
            name: 'FILE_ALREADY_LINKED',
          });
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
            chunkSizeBytes: 1024 * 1024, // 1MB
            metadata: { 'content-type': type },
          },
        );

        await pipeline(
          req.raw,
          new PassThrough({ highWaterMark: 1024 * 1024 * 4 }), // 4MB Buffer
          writeStream,
        );

        await finished(writeStream, { readable: false });

        const { length } = writeStream;
        await services.files.linkFile({ fileId, size: length, type });

        reply.status(200);
        return reply.send({
          success: true,
          fileId,
          size: length,
          type,
        });
      }
      logger.error('Invalid signature', { fileId, expiryDate });
      reply.status(403);
      return reply.send({
        success: false,
        message: 'Access restricted: Invalid signature.',
        name: 'INVALID_SIGNATURE',
      });
    }

    if (req.method === 'GET') {
      const { s: signature, e: expiryTimestamp } = req.query as Record<string, string>;
      const fileDocument = await modules.files.findFile({
        url: `${GRIDFS_PUT_SERVER_PATH}/${directoryName}/${fileName}`,
      });
      if (fileDocument?.meta?.isPrivate) {
        const expiry = parseInt(expiryTimestamp as string, 10);
        if (expiry <= Date.now()) {
          logger.error('URL Expired', { fileName, expiry });
          reply.status(403);
          return reply.send({
            success: false,
            message: 'Access restricted: URL expired.',
            name: 'URL_EXPIRED',
          });
        }

        const fileUploadAdapter = getFileAdapter();
        const signedUrl = await fileUploadAdapter.createDownloadURL(fileDocument, expiry);

        if (!signedUrl || new URL(signedUrl, 'file://').searchParams.get('s') !== signature) {
          reply.status(403);
          logger.error('Invalid signature', { fileName, expiry });
          return reply.send({
            success: false,
            message: 'Access restricted: Invalid signature.',
            name: 'INVALID_SIGNATURE',
          });
        }
      } else if (!fileDocument) {
        logger.error('File not found', { fileName });
        reply.status(404);
        return reply.send();
      }

      const file = await modules.gridfsFileUploads.getFileInfo(directoryName, fileDocument._id);

      if (file?.metadata?.['content-type']) {
        reply.header('content-type', file.metadata['content-type']);
      }
      if (file?.length) {
        reply.header('content-length', file?.length.toString());
      }

      const readStream = await modules.gridfsFileUploads.createReadStream(
        directoryName,
        fileDocument._id,
      );

      reply.status(200);
      return reply.send(readStream);
    }

    reply.status(404);
    return reply.send();
  } catch (e) {
    logger.error(e);

    if (e.code === 'ENOENT') {
      reply.status(404);
      return reply.send();
    } else {
      reply.status(504);
      return reply.send({ success: false, name: e.name, code: e.code, message: e.message });
    }
  }
};

export default gridfsHandler;
