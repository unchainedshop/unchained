import WorkerPlugin from 'meteor/unchained:core-worker/workers/base';
import { WorkerDirector } from 'meteor/unchained:core-worker';
import { createLogger } from 'meteor/unchained:core-logger';
import yj from 'yieldable-json';
import createBulkImporter, { BulkImportPayloads } from '../bulk-importer';

const logger = createLogger('unchained:platform:bulk-import');

const unpackEvents = async (payloadId) => {
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
        resolve(data);
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
      const { events } = rawPayload.payloadId
        ? await unpackEvents(rawPayload.payloadId)
        : rawPayload;

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
      logger.warn(err.message, err);
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
