import { WorkerDirector, WorkerAdapter, type IWorkerAdapter } from '@unchainedshop/core';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:bulk-import');

export const BulkImportWorker: IWorkerAdapter<any, Record<string, any>> = {
  ...WorkerAdapter,

  key: 'shop.unchained.worker-plugin.bulk-import',
  label: 'Bulk Import',
  version: '1.0.0',
  type: 'BULK_IMPORT',
  maxParallelAllocations: 1, // Only ever process 1 BULK_IMPORT at a time!

  doWork: async (rawPayload, unchainedAPI) => {
    try {
      const {
        createShouldUpsertIfIDExists = false,
        skipCacheInvalidation = false,
        updateShouldUpsertIfIDNotExists = false,
      } = rawPayload;

      const bulkImporter = unchainedAPI.bulkImporter.createBulkImporter({
        createShouldUpsertIfIDExists,
        updateShouldUpsertIfIDNotExists,
        skipCacheInvalidation,
      });

      if (rawPayload.payloadId) {
        // stream payload from gridfs
        const readStream = await unchainedAPI.services.files.createDownloadStream({
          fileId: rawPayload.payloadId,
        });
        if (!readStream) {
          throw new Error('Could not create download stream from uploaded file');
        }
        await unchainedAPI.bulkImporter.pipeEventStream(readStream, bulkImporter, unchainedAPI);
      } else {
        const { events } = rawPayload;
        if (!events?.length) throw new Error('No events submitted');

        await events.reduce(async (currentEventPromise, nextEvent) => {
          await currentEventPromise;
          await bulkImporter.validate(nextEvent);
          return bulkImporter.prepare(nextEvent, unchainedAPI);
        }, Promise.resolve());
      }

      const [result, error] = await bulkImporter.execute();
      await bulkImporter.invalidateCaches(unchainedAPI);

      if (error) {
        return {
          success: false,
          result: result!,
          error,
        };
      }
      return {
        success: true,
        result: result!,
      };
    } catch (err) {
      logger.error(err);
      return {
        success: false,
        error: {
          name: err.name,
          message: err.message,
          stack: err.stack,
        },
      };
    }
  },
};

WorkerDirector.registerAdapter(BulkImportWorker);
