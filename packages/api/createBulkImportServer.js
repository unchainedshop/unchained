import { WebApp } from 'meteor/webapp';
import { createLogger } from 'meteor/unchained:core-logger';
import { WorkerDirector } from 'meteor/unchained:core-worker';
import { checkAction } from './acl';
import { actions } from './roles';

const logger = createLogger('unchained:api');

const { BULK_IMPORT_API_PATH = '/bulk-import' } = process.env;

export default (options) => {
  const { contextResolver } = options || {};

  WebApp.connectHandlers.use(BULK_IMPORT_API_PATH, async (req, res) => {
    const resolvedContext = await contextResolver({ req });
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
      return res.end();
    }
  });

  return WebApp.connectHandlers;
};
