import { createLogger } from '@unchainedshop/logger';
import { UnchainedContextResolver } from '@unchainedshop/types/api.js';
import { checkAction } from '../acl.js';
import { actions } from '../roles/index.js';

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

export default function bulkImportMiddleware(contextResolver: UnchainedContextResolver) {
  return async (req, res) => {
    try {
      if (req.method !== 'POST') {
        methodWrongHandler(res)();
        return;
      }

      const context = await contextResolver({ req, res });
      await checkAction(context, (actions as any).bulkImport);

      const input: any = {
        createShouldUpsertIfIDExists: !!req.query?.createShouldUpsertIfIDExists,
        skipCacheInvalidation: !!req.query?.skipCacheInvalidation,
        remoteAddress: context.remoteAddress,
      };

      const date = new Date().toISOString();
      const file = await context.services.files.uploadFileFromStream(
        {
          directoryName: 'bulk-import-streams',
          rawFile: { filename: `${date}.json`, createReadStream: () => req },
        },
        context,
      );

      input.payloadId = file._id;
      input.payloadSize = file.size;

      const purgedInput = Object.fromEntries(
        Object.entries(input).filter(([, value]) => Boolean(value)),
      );

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
  };
}
