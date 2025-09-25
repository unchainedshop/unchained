import { WorkerDirector, WorkerAdapter, IWorkerAdapter } from '@unchainedshop/core';
import { createLogger } from '@unchainedshop/logger';
import JSONStream from 'minipass-json-stream';
import { UnchainedCore } from '@unchainedshop/core';
import { pipeline } from 'node:stream/promises';
import { PassThrough } from 'node:stream';

const logger = createLogger('unchained:worker:bulk-import');

const streamPayloadToBulkImporter = async (
  bulkImporter,
  payloadId,
  unchainedAPI: Pick<UnchainedCore, 'bulkImporter' | 'modules' | 'services'>,
) => {
  logger.trace(`parseAsync start`);

  const readStream = await unchainedAPI.services.files.createDownloadStream({ fileId: payloadId });

  if (!readStream) {
    throw new Error(
      'The current file adapter does not support streams when downloading required for streamed events. Please use a different file adapter.',
    );
  }

  await pipeline(
    readStream,
    new PassThrough({
      highWaterMark: 100,
    }),
    JSONStream.parse('events.*'),
    async function* (source) {
      for await (const event of source) {
        await bulkImporter.prepare(event, unchainedAPI);
      }
      yield true;
    },
  );

  logger.trace(`parseAsync done`);
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
