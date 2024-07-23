import { createLogger } from '@unchainedshop/logger';
import { checkAction } from '../acl.js';
import { actions } from '../roles/index.js';
import { IncomingMessage } from 'http';
import { Context } from '@unchainedshop/types/api.js';

const logger = createLogger('unchained:bulk-import');

const errorHandler = (res) => (e) => {
  logger.error(e.message);
  res.writeHead(503);
  res.end(JSON.stringify({ name: e.name, code: e.code, message: e.message }));
};

const methodWrongHandler = (res) => () => {
  logger.error('Method not supported, return 404');
  res.writeHead(404);
  res.end();
};

export default async function bulkImportMiddleware(
  req: IncomingMessage & { unchainedContext: Context },
  res,
) {
  try {
    const context = req.unchainedContext;

    if (req.method !== 'POST') {
      methodWrongHandler(res)();
      return;
    }

    await checkAction(context, (actions as any).bulkImport);

    const input: any = {
      createShouldUpsertIfIDExists: !!req.query?.createShouldUpsertIfIDExists,
      updateShouldUpsertIfIDNotExists: !!req.query?.updateShouldUpsertIfIDNotExists,
      skipCacheInvalidation: !!req.query?.skipCacheInvalidation,
      remoteAddress: context.remoteAddress,
    };

    const date = new Date().toISOString();

    const file = await context.services.files.uploadFileFromStream(
      {
        directoryName: 'bulk-import-streams',
        rawFile: Promise.resolve({ filename: `${date}.json`, createReadStream: () => req }),
        meta: {},
      },
      context,
    );

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
