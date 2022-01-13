import { IWorkerAdapter } from '@unchainedshop/types/worker';
import { WorkerDirector } from 'meteor/unchained:core-worker';
import { createLogger } from 'meteor/unchained:logger';
import { BaseAdapter } from 'meteor/unchained:utils';
import yj from 'yieldable-json';
import { BulkImportPayloads, createBulkImporter } from '../bulk-importer/createBulkImporter';

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
      logger.profile(`parseAsync`);
      yj.parseAsync(buffer.toString(), undefined, 8, (err, data) => {
        logger.profile(`parseAsync`);
        if (err) {
          reject(err);
          return;
        }
        resolve({ ...data, ...options });
      });
    });
  });
};

export const BulkImportWorker: IWorkerAdapter<any, {}> = {
  ...BaseAdapter,

  key: 'shop.unchained.worker-plugin.bulk-import',
  label: 'Bulk Import',
  version: '1.0',
  type: 'BULK_IMPORT',

  doWork: async (rawPayload) => {
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
      await bulkImporter.invalidateCaches();
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

WorkerDirector.registerAdapter(BulkImportWorker);
