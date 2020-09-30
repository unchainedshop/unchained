import WorkerPlugin from 'meteor/unchained:core-worker/workers/base';
import { WorkerDirector } from 'meteor/unchained:core-worker';
import { createLogger } from 'meteor/unchained:core-logger';
import createBulkImporter from '../bulk-importer';

const logger = createLogger('unchained:platform:bulk-import');

class BulkImport extends WorkerPlugin {
  static key = 'shop.unchained.worker-plugin.bulk-import';

  static label = 'Bulk Import';

  static version = '1.0';

  static type = 'BULK_IMPORT';

  static async doWork({ events }) {
    try {
      if (!events?.length) throw new Error('No events submitted');
      const bulkImporter = createBulkImporter({ logger, authorId: 'root' });
      for (let i = 0, len = events.length; i < len; i += 1) {
        // eslint-disable-next-line
        await bulkImporter.prepare(events[i]);
      }
      const result = await bulkImporter.execute();
      return {
        success: true,
        result,
      };
    } catch (err) {
      logger.warn(err.stack);
      return {
        success: false,
        error: {
          name: err.name,
          message: err.message,
          stack: err.stack,
        },
      };
    }
  }
}

WorkerDirector.registerPlugin(BulkImport);

export default BulkImport;
