import { createLogger } from '@unchainedshop/logger';
import { checkAction } from '../acl.js';
import { actions } from '../roles/index.js';
import { Context } from '../context.js';

const logger = createLogger('unchained:bulk-import');

const errorHandler = (res) => (e) => {
  logger.error(e.message);
  res.writeHead(503);
  res.end(JSON.stringify({ name: e.name, code: e.code, message: e.message }));
};

const methodWrongHandler = (res) => {
  logger.error('Method not supported, return 404');
  res.writeHead(404);
  res.end();
  return;
};

export default async function bulkImportMiddleware(
  req: Request & { query?: any; unchainedContext: Context },
  res,
) {
  try {
    const context = req.unchainedContext;

    if (req.method !== 'POST') {
      return methodWrongHandler(res);
    }

    await checkAction(context, (actions as any).bulkImport);

    const input: any = {
      createShouldUpsertIfIDExists: !!req.query?.createShouldUpsertIfIDExists,
      updateShouldUpsertIfIDNotExists: !!req.query?.updateShouldUpsertIfIDNotExists,
      skipCacheInvalidation: !!req.query?.skipCacheInvalidation,
      remoteAddress: context.remoteAddress,
    };

    const date = new Date().toISOString();

    const file = await context.services.files.uploadFileFromStream({
      directoryName: 'bulk-import-streams',
      rawFile: Promise.resolve({ filename: `${date}.json`, createReadStream: () => req }),
      meta: {},
    });

    input.payloadId = file._id;
    input.payloadSize = file.size;

    const purgedInput = Object.fromEntries(Object.entries(input).filter(([, value]) => Boolean(value)));

    const work = await context.modules.worker.addWork({
      type: 'BULK_IMPORT',
      input: purgedInput,
      retries: 0,
      priority: 10,
    });

    res.writeHead(200);
    res.end(JSON.stringify(work));
  } catch (e) {
    errorHandler(res)(e);
  }
}
