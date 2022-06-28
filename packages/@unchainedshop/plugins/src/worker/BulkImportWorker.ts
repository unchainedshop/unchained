import { IWorkerAdapter } from '@unchainedshop/types/worker';
import { WorkerDirector } from '@unchainedshop/core-worker';
import { createLogger, LogLevel } from '@unchainedshop/logger';
import { BaseAdapter } from '@unchainedshop/utils';
import fs from 'fs';
import JSONStream from 'JSONStream';
import { EventIterator } from 'event-iterator';

const logger = createLogger('unchained:platform:bulk-import');

const streamPayloadToBulkImporter = async (bulkImporter, createReadStream) => {
  logger.profile(`parseAsync`, { level: LogLevel.Verbose, message: 'parseAsync' });

  const eventIterator = new EventIterator(
    (queue) => {
      const readStream = createReadStream();
      const jsonStream = JSONStream.parse('events.*'); // rows, ANYTHING, doc
      jsonStream.on('data', queue.push);
      jsonStream.on('close', queue.stop);
      jsonStream.on('error', queue.fail);

      queue.on('highWater', () => readStream.pause());
      queue.on('lowWater', () => readStream.resume());

      readStream.pipe(jsonStream);
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
    await bulkImporter.prepare(event);
  }

  logger.profile(`parseAsync`, { level: LogLevel.Verbose, message: 'parseAsync' });
};

export const BulkImportWorker: IWorkerAdapter<any, Record<string, unknown>> = {
  ...BaseAdapter,

  key: 'shop.unchained.worker-plugin.bulk-import',
  label: 'Bulk Import',
  version: '1.0',
  type: 'BULK_IMPORT',

  doWork: async (rawPayload, context) => {
    try {
      const {
        createShouldUpsertIfIDExists = false,
        skipCacheInvalidation = false,
        authorId = 'root',
      } = rawPayload;

      const bulkImporter = context.bulkImporter.createBulkImporter(
        {
          logger,
          authorId,
          createShouldUpsertIfIDExists,
          skipCacheInvalidation,
        },
        context,
      );

      if (rawPayload.payloadFilePath) {
        // stream payload from file system
        await streamPayloadToBulkImporter(bulkImporter, () =>
          fs.createReadStream(rawPayload.payloadFilePath),
        );
      } else if (rawPayload.payloadId) {
        // stream payload from gridfs
        await streamPayloadToBulkImporter(bulkImporter, () =>
          context.bulkImporter.BulkImportPayloads.openDownloadStream(rawPayload.payloadId),
        );
      } else {
        const { events } = rawPayload;
        if (!events?.length) throw new Error('No events submitted');

        await events.reduce(async (currentEventPromise, nextEvent) => {
          await currentEventPromise;
          return bulkImporter.prepare(nextEvent);
        }, Promise.resolve());
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
  },
};

WorkerDirector.registerAdapter(BulkImportWorker);