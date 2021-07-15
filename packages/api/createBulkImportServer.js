import { createLogger } from 'meteor/unchained:core-logger';
import { WorkerDirector } from 'meteor/unchained:core-worker';
import { getContext, withContext } from 'meteor/unchained:utils/context';
import { checkAction } from './acl';
import { actions } from './roles';

const logger = createLogger('unchained:api');

const { BULK_IMPORT_API_PATH = '/bulk-import' } = process.env;

const bulkImportMiddleware = async (req, res) => {
  try {
    const resolvedContext = await getContext();
    checkAction(actions.bulkImport, resolvedContext.userId);

    const date = new Date().toISOString();
    if (req.method === 'POST') {
      req
        .pipe(
          resolvedContext.bulkImporter.BulkImportPayloads.openUploadStreamWithId(
            date,
            `${date}.json`,
            {
              contentType: 'application/json',
            }
          )
        )
        .on('error', (e) => {
          logger.error(e.message);
          res.writeHead(503);
          res.end(JSON.stringify(e));
        })
        .on('finish', async (file) => {
          try {
            const { ...work } = await WorkerDirector.addWork({
              type: 'BULK_IMPORT',
              input: {
                payloadId: file._id,
                payloadSize: file.length,
                createShouldUpsertIfIDExists:
                  !!req.query?.createShouldUpsertIfIDExists,
                remoteAddress: resolvedContext.remoteAddress,
              },
              retries: 0,
              priority: 10,
            });
            res.writeHead(200);
            res.end(JSON.stringify(work));
          } catch (e) {
            logger.error(e.message);
            res.writeHead(503);
            res.end(JSON.stringify(e));
          }
        });
    } else {
      res.writeHead(404);
      res.end();
    }
  } catch (e) {
    logger.error(e.message);
    res.writeHead(503);
    res.end(JSON.stringify(e));
  }
};

export default (options) => {
  const { context } = options || {};
  WebApp.connectHandlers.use(
    BULK_IMPORT_API_PATH,
    withContext(context)(bulkImportMiddleware)
  );
};
