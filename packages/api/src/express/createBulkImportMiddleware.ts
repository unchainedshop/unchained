import { createLogger } from '@unchainedshop/logger';
import { UnchainedContextResolver } from '@unchainedshop/types/api';
import fs from 'fs';
import { checkAction } from '../acl';
import { actions } from '../roles';

const logger = createLogger('unchained:bulk-import');

const { BULK_IMPORT_PAYLOAD_CACHE_DIRECTORY } = process.env;

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

const createWriteStreamToFilesystem = (cacheDirectory) => {
  const date = new Date().toISOString();
  const payloadFilePath = `${cacheDirectory}/${date}.json`;
  const stream = fs.createWriteStream(payloadFilePath, { flags: 'a' });
  return stream;
};

const createWriteStreamToMongoDB = (BulkImportPayloads) => {
  const date = new Date().toISOString();
  const stream = BulkImportPayloads.openUploadStreamWithId(date, `${date}.json`, {
    contentType: 'application/json',
  });
  return stream;
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
        fsPayloadCacheDirectory: BULK_IMPORT_PAYLOAD_CACHE_DIRECTORY,
        remoteAddress: context.remoteAddress,
      };

      const stream = input.fsPayloadCacheDirectory
        ? createWriteStreamToFilesystem(input.fsPayloadCacheDirectory)
        : createWriteStreamToMongoDB(context.bulkImporter.BulkImportPayloads);

      req
        .pipe(stream)
        .on('error', errorHandler(res))
        .on('finish', async (file) => {
          try {
            if (input.fsPayloadCacheDirectory) {
              input.payloadFilePath = stream.path;
            } else {
              input.payloadId = file._id;
              input.payloadSize = file.length;
            }
            const work = await context.modules.worker.addWork({
              type: 'BULK_IMPORT',
              input: Object.fromEntries(Object.entries(input).filter(([, value]) => Boolean(value))),
              retries: 0,
              priority: 10,
            });
            res.writeHead(200);
            res.end(JSON.stringify(work));
          } catch (e) {
            errorHandler(res)(e);
          }
        });
    } catch (e) {
      errorHandler(res)(e);
    }
  };
}
