import { z } from 'zod';
import JSONStream from 'minipass-json-stream';
import { PassThrough, Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import * as AssortmentHandlers from './handlers/assortment/index.ts';
import * as FilterHandlers from './handlers/filter/index.ts';
import * as ProductHandlers from './handlers/product/index.ts';
import { createLogger } from '@unchainedshop/logger';
import type { Modules } from '../modules.ts';
import type { Services } from '../services/index.ts';

const logger = createLogger('unchained:bulk-import');

export interface BulkImportOperationResult {
  entity: string;
  operation: string;
  success: boolean;
}
export type BulkImportOperation<T> = { payloadSchema?: z.ZodObject } & ((
  payload: any,
  options: {
    createShouldUpsertIfIDExists?: boolean;
    updateShouldUpsertIfIDNotExists?: boolean;
    skipCacheInvalidation?: boolean;
  },
  unchainedAPI: T,
) => Promise<BulkImportOperationResult>);

export type BulkImportHandler<T> = Record<string, BulkImportOperation<T>>;

let bulkOperationHandlers: Record<string, BulkImportHandler<any>> = {};

export const getOperation = (entity: string, operation: string): BulkImportOperation<any> => {
  if (
    entity === '__PROTO__' ||
    entity === 'CONSTRUCTOR' ||
    entity === 'PROTOTYPE' ||
    operation === '__PROTO__' ||
    operation === 'CONSTRUCTOR' ||
    operation === 'PROTOTYPE'
  ) {
    throw new Error(`Dude!`);
  }
  const handlers = bulkOperationHandlers[entity];
  if (!handlers) {
    throw new Error(`Entity unknown`);
  }

  const entityOperation = handlers[operation] as BulkImportOperation<any>;

  if (!entityOperation || typeof entityOperation !== 'function') {
    throw new Error(`Operation unknown/invalid`);
  }

  return entityOperation;
};

export default function createBulkImporterFactory(bulkImporterOptions: any) {
  bulkOperationHandlers = {
    ASSORTMENT: AssortmentHandlers,
    PRODUCT: ProductHandlers,
    FILTER: FilterHandlers,
    ...(bulkImporterOptions?.handlers || {}),
  };

  const createBulkImporter = (options) => {
    const preparationIssues: {
      operation: string;
      entity: string;
      payloadId: string;
      errorCode: string;
      errorMessage: string;
    }[] = [];
    const processedOperations = {};
    const { createShouldUpsertIfIDExists, skipCacheInvalidation, updateShouldUpsertIfIDNotExists } =
      options;

    logger.debug(
      `Configure event import with options: createShouldUpsertIfIDExists=${createShouldUpsertIfIDExists} updateShouldUpsertIfIDNotExists=${updateShouldUpsertIfIDNotExists} skipCacheInvalidation=${skipCacheInvalidation}`,
    );

    return {
      validate: async (event) => {
        const entity = event.entity.toUpperCase();
        const operation = event.operation.toLowerCase();
        logger.debug(`🩺 ${entity}.${operation}.${event.payload?._id || '*'}`);
        try {
          const fn = getOperation(entity, operation);
          if (fn.payloadSchema) {
            fn.payloadSchema.parse(event.payload);
          }
        } catch (e) {
          throw new Error(`🤧 ${entity}.${operation}.${event.payload?._id || '*'} (${e.message})`);
        }
      },
      prepare: async (event, unchainedAPI: { modules: Modules; services: Services }) => {
        const entity = event.entity.toUpperCase();
        const operation = event.operation.toLowerCase();

        const handler = getOperation(entity, operation);

        const payloadId = event.payload?._id || 'global';

        logger.debug(`🏃‍♂️ ${entity}.${operation}.${payloadId}`);

        try {
          await handler(event.payload, { logger, ...options }, unchainedAPI);
          if (!processedOperations[entity]) processedOperations[entity] = {};
          if (!processedOperations[entity][operation]) processedOperations[entity][operation] = [];
          processedOperations[entity][operation].push(payloadId);
          logger.debug(`👍 ${entity}.${operation}.${payloadId}`);
        } catch (e) {
          logger.debug(`💥 ${entity}.${operation}.${payloadId} (${e.message})`);
          preparationIssues.push({
            operation,
            entity,
            payloadId,
            errorCode: e.name,
            errorMessage: e.message,
          });
        } finally {
          logger.debug(`🏁 ${entity}.${operation}.${payloadId}`);
        }
      },
      execute: async () => {
        const operationResults = {
          processedOperations,
        };
        if (preparationIssues?.length) {
          logger.warn(
            `${preparationIssues.length} issues occured while preparing events, import finished with errors`,
          );
          const errors = { preparationIssues };
          return [operationResults, errors];
        }
        return [operationResults, null];
      },
      invalidateCaches: async (unchainedAPI: { modules: Modules; services: Services }) => {
        if (skipCacheInvalidation) return;
        await unchainedAPI.modules.assortments.invalidateCache({}, { skipUpstreamTraversal: true });
        await unchainedAPI.services.filters.invalidateFilterCache();
      },
    };
  };

  const validateEventStream = async (readStream: Readable) => {
    const bulkImporter = createBulkImporter({});
    await pipeline(
      readStream,
      JSONStream.parse('events.*'),
      async function* (source: AsyncIterable<any>, { signal }) {
        for await (const event of source) {
          if (signal.aborted) break;
          await bulkImporter.validate(event);
        }
        yield true;
      },
    );
  };

  const pipeEventStream = async (
    readStream: Readable,
    bulkImporter: ReturnType<typeof createBulkImporter>,
    unchainedAPI: { modules: Modules; services: Services },
  ) => {
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
  };

  return {
    createBulkImporter,
    validateEventStream,
    pipeEventStream,
  };
}

export type BulkImporter = ReturnType<typeof createBulkImporterFactory>;

export { AssortmentHandlers, ProductHandlers, FilterHandlers };
