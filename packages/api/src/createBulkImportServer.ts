import { createLogger } from 'meteor/unchained:logger';
import { Context } from '@unchainedshop/types/api';
import fs from 'fs';
import { checkAction } from './acl';
import { actions } from './roles';

import { useMiddlewareWithCurrentContext } from './context';

const logger = createLogger('unchained:api');

const { BULK_IMPORT_API_PATH = '/bulk-import' } = process.env;

const errorHandler = (res) => (e) => {
  logger.error(e.message);
  res.writeHead(503);
  res.end(JSON.stringify(e));
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

const bulkImportMiddleware = async (req, res) => {
  try {
    if (req.method !== 'POST') {
      methodWrongHandler(res)();
      return;
    }

    const resolvedContext = req.unchainedContext as Context;
    await checkAction(resolvedContext, (actions as any).bulkImport);

    const input: any = {
      createShouldUpsertIfIDExists: !!req.query?.createShouldUpsertIfIDExists,
      skipCacheInvalidation: !!req.query?.skipCacheInvalidation,
      fsPayloadCacheDirectory: req.query?.fsPayloadCacheDirectory,
      remoteAddress: resolvedContext.remoteAddress,
    };

    const stream = input.fsPayloadCacheDirectory
      ? createWriteStreamToFilesystem(input.fsPayloadCacheDirectory)
      : createWriteStreamToMongoDB(resolvedContext.bulkImporter.BulkImportPayloads);

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
          const work = await resolvedContext.modules.worker.addWork(
            {
              type: 'BULK_IMPORT',
              input: Object.fromEntries(Object.entries(input).filter(([, value]) => Boolean(value))),
              retries: 0,
              priority: 10,
            },
            resolvedContext.userId,
          );
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

export default () => {
  useMiddlewareWithCurrentContext(BULK_IMPORT_API_PATH, bulkImportMiddleware);
};
