import { WorkerDirector, WorkerAdapter, IWorkerAdapter } from '@unchainedshop/core';
import { createLogger, LogLevel } from '@unchainedshop/logger';
import JSONStream from 'JSONStream';
import { EventIterator } from 'event-iterator';
import { UnchainedCore } from '@unchainedshop/core';

const logger = createLogger('unchained:worker:bulk-import');

const streamPayloadToBulkImporter = async (bulkImporter, payloadId, unchainedAPI: UnchainedCore) => {
  logger.profile(`parseAsync`, { level: LogLevel.Verbose, message: 'parseAsync' });

  const readStream = await unchainedAPI.services.files.createDownloadStream(
    { fileId: payloadId },
    unchainedAPI,
  );

  if (!readStream) {
    throw new Error(
      'The current file adapter does not support streams when downloading required for streamed events. Please use a different file adapter.',
    );
  }

  const eventIterator = new EventIterator(
    (queue) => {
      const jsonStream = JSONStream.parse('events.*'); // rows, ANYTHING, doc
      jsonStream.on('data', queue.push);
      jsonStream.on('close', queue.stop);
      jsonStream.on('error', queue.fail);

      queue.on('highWater', () => readStream.pause());
      queue.on('lowWater', () => readStream.resume());

      readStream.pipe(jsonStream);
      readStream.on('error', queue.fail);

      return () => {
        jsonStream.removeListener('data', queue.push);
        jsonStream.removeListener('close', queue.stop);
        jsonStream.removeListener('error', queue.fail);
        jsonStream.destroy();
      };
    },
    { highWaterMark: 100, lowWaterMark: 5 },
  );

  for await (const event of eventIterator) { // eslint-disable-line
    await bulkImporter.prepare(event, unchainedAPI);
  }

  logger.profile(`parseAsync`, { level: LogLevel.Verbose, message: 'parseAsync' });
};

export const BulkImportWorker: IWorkerAdapter<any, Record<string, unknown>> = {
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
        logger,
        createShouldUpsertIfIDExists,
        updateShouldUpsertIfIDNotExists,
        skipCacheInvalidation,
      });

      if (rawPayload.payloadId) {
        // stream payload from gridfs
        await streamPayloadToBulkImporter(bulkImporter, rawPayload.payloadId, unchainedAPI);
      } else {
        const { events } = rawPayload;
        if (!events?.length) throw new Error('No events submitted');

        await events.reduce(async (currentEventPromise, nextEvent) => {
          await currentEventPromise;
          return bulkImporter.prepare(nextEvent, unchainedAPI);
        }, Promise.resolve());
      }

      const [result, error] = await bulkImporter.execute();
      await bulkImporter.invalidateCaches(unchainedAPI);

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
  },
};

WorkerDirector.registerAdapter(BulkImportWorker);
