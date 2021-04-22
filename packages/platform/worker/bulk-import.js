import WorkerPlugin from 'meteor/unchained:core-worker/workers/base';
import { WorkerDirector } from 'meteor/unchained:core-worker';
import { createLogger } from 'meteor/unchained:core-logger';
import yj from 'yieldable-json';
import createBulkImporter, { BulkImportPayloads } from '../bulk-importer';

const logger = createLogger('unchained:platform:bulk-import');

const unpackPayload = async ({ payloadId, ...options }) => {
  return new Promise((resolve, reject) => {
    const buffers = [];
    const readStream = BulkImportPayloads.openDownloadStream(payloadId);
    readStream.on('data', (buffer) => {
      buffers.push(buffer);
    });
    readStream.on('end', () => {
      const buffer = Buffer.concat(buffers);
      logger.profile(`parseAsync`, { level: 'verbose' });
      yj.parseAsync(buffer.toString(), undefined, 8, (err, data) => {
        logger.profile(`parseAsync`, { level: 'verbose' });
        if (err) {
          reject(err);
          return;
        }
        resolve({ ...data, ...options });
      });
    });
  });
};

class BulkImport extends WorkerPlugin {
  static key = 'shop.unchained.worker-plugin.bulk-import';

  static label = 'Bulk Import';

  static version = '1.0';

  static type = 'BULK_IMPORT';

  static async doWork(rawPayload) {
    try {
      const {
        events,
        createShouldUpsertIfIDExists = false,
        authorId = 'root',
      } = rawPayload.payloadId ? await unpackPayload(rawPayload) : rawPayload;

      if (!events?.length) throw new Error('No events submitted');
      const bulkImporter = createBulkImporter({
        logger,
        authorId,
        createShouldUpsertIfIDExists,
      });
      for (let i = 0, len = events.length; i < len; i += 1) {
        // eslint-disable-next-line
        await bulkImporter.prepare(events[i]);
      }
      const [result, error] = await bulkImporter.execute();
      if (error) {
        return {
          success: false,
          result,
          error,
        };
      }
      return {
        success: true,
        result,
      };
    } catch (err) {
      logger.error(err.message, err);
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
