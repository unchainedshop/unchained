import { createLogger } from '@unchainedshop/logger';
import { getFileAdapter } from '@unchainedshop/core-files';
import { checkAction } from '../acl.js';
import { actions } from '../roles/index.js';
import { Context } from '../context.js';
import { FastifyRequest, RouteHandlerMethod } from 'fastify';

const logger = createLogger('unchained:temp-upload');

const tempUploadHandler: RouteHandlerMethod = async (
  req: FastifyRequest & { file: any; unchainedContext: Context },
  res,
) => {
  try {
    const context = req.unchainedContext;

    await checkAction(context, (actions as any).uploadTempFile);

    const data = await req.file();

    const file = await context.services.files.uploadFileFromStream({
      directoryName: 'temp-uploads',
      rawFile: Promise.resolve({
        filename: data.filename,
        createReadStream: () => data.file,
        mimetype: data.mimetype,
      }),
      meta: { fieldname: data.fieldname, encoding: data.encoding },
    });

    // Add an expiration date to this file manually!
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await context.modules.files.update(file._id, {
      expires, // Default to 1 hour
    });

    const fileUploadAdapter = getFileAdapter();
    const rawUrl = await fileUploadAdapter.createDownloadURL(file);
    const url = context.modules.files.normalizeUrl(rawUrl, {});
    const body = JSON.stringify({ fileId: file._id, url, expires: expires.toISOString() });
    res.status(200);
    res.header('Content-Length', Buffer.byteLength(body));
    res.header('Content-Type', 'application/json');
    return res.send(body);
  } catch (e) {
    logger.error(e.message);
    res.status(503);
    return res.send(JSON.stringify({ name: e.name, code: e.code, message: e.message }));
  }
};

export default tempUploadHandler;
