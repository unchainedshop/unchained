import { createLogger } from '@unchainedshop/logger';
import { checkAction } from '../acl.js';
import { actions } from '../roles/index.js';
import { Context } from '../context.js';
import { getFileAdapter } from '@unchainedshop/core-files';

const logger = createLogger('unchained:temp-upload');

const methodWrongHandler = (res) => {
  logger.error('Method not supported, return 404');
  res.status(404).end();
  return;
};

export default async function tempUploadMiddleware(
  req: Request & { query?: any; files: any; unchainedContext: Context },
  res,
) {
  try {
    const context = req.unchainedContext;

    if (req.method !== 'POST') {
      return methodWrongHandler(res);
    }

    await checkAction(context, (actions as any).uploadTempFile);

    const [data] = req.files || [];

    const file = await context.services.files.uploadFileFromStream({
      directoryName: 'temp-uploads',
      rawFile: {
        filename: data.originalname,
        buffer: data.buffer,
        mimetype: data.mimetype,
      },
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
    res.status(200).send({ fileId: file._id, url, expires: expires.toISOString() });
  } catch (e) {
    logger.error(e.message);
    res.status(503).send({ name: e.name, code: e.code, message: e.message });
    return;
  }
}
