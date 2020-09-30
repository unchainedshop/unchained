import { WebApp } from 'meteor/webapp';
import { log } from 'meteor/unchained:core-logger';
import { WorkerDirector } from 'meteor/unchained:core-worker';
import bodyParser from 'body-parser';
import { checkAction } from './acl';
import { actions } from './roles';

const { BULK_IMPORT_API_PATH = '/bulk-import' } = process.env;

export default (options) => {
  const { contextResolver } = options || {};

  WebApp.connectHandlers.use(
    BULK_IMPORT_API_PATH,
    bodyParser.json({ strict: false })
  );
  WebApp.connectHandlers.use(BULK_IMPORT_API_PATH, async (req, res) => {
    const resolvedContext = await contextResolver({ req });
    checkAction(actions.bulkImport, resolvedContext.userId);

    if (req.method === 'POST') {
      try {
        const { ...work } = await WorkerDirector.addWork({
          type: 'BULK_IMPORT',
          input: req.body,
          retries: 0,
          priority: 10,
        });
        res.writeHead(200);
        return res.end(JSON.stringify(work));
      } catch (e) {
        log.error(e.message);
        res.writeHead(503);
        return res.end(JSON.stringify(e));
      }
    }
    res.writeHead(404);
    return res.end();
  });

  return WebApp.connectHandlers;
};
