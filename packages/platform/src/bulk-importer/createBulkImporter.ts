import mongodb, { BulkOperationBase } from 'mongodb';
import { BulkImporter, UnchainedCore } from '@unchainedshop/types/core.js';
import * as AssortmentHandlers from './handlers/assortment/index.js';
import * as FilterHandlers from './handlers/filter/index.js';
import * as ProductHandlers from './handlers/product/index.js';

export type BulkImportOperationResult = {
  entity: string;
  operation: string;
  success: boolean;
};
export type BulkImportOperation = (
  payload: any,
  options: {
    bulk: (collection: string) => BulkOperationBase;
    createShouldUpsertIfIDExists?: boolean;
    skipCacheInvalidation?: boolean;
    logger?: any;
  },
  unchainedAPI: UnchainedCore,
) => Promise<BulkImportOperationResult>;

export type BulkImportHandler = {
  [x: string]: BulkImportOperation;
};

let bulkOperationHandlers: Record<string, BulkImportHandler> = {};

export const getOperation = (entity: string, operation: string): BulkImportOperation => {
  const handlers = bulkOperationHandlers[entity];
  if (!handlers) {
    throw new Error(`Entity ${entity} unknown`);
  }

  const entityOperation = handlers[operation] as BulkImportOperation;

  if (!entityOperation || typeof entityOperation !== 'function') {
    throw new Error(`Operation ${operation} for entity ${entity} invalid`);
  }

  return entityOperation;
};

export const createBulkImporterFactory = (db, bulkImporterOptions: any): BulkImporter => {
  bulkOperationHandlers = {
    ASSORTMENT: AssortmentHandlers,
    PRODUCT: ProductHandlers,
    FILTER: FilterHandlers,
    ...(bulkImporterOptions?.handlers || {}),
  };

  const createBulkImporter: BulkImporter['createBulkImporter'] = (options) => {
    const bulkOperations = {};
    const preparationIssues = [];
    const processedOperations = {};
    const { logger, createShouldUpsertIfIDExists, skipCacheInvalidation } = options;

    const bulk = (collectionName: string) => {
      const Collection = db.collection(collectionName);
      if (!bulkOperations[collectionName])
        bulkOperations[collectionName] = Collection.initializeOrderedBulkOp();
      return bulkOperations[collectionName];
    };

    logger.info(
      `Configure event import with options: createShouldUpsertIfIDExists=${createShouldUpsertIfIDExists} skipCacheInvalidation=${skipCacheInvalidation}`,
    );

    return {
      prepare: async (event, unchainedAPI: UnchainedCore) => {
        const entity = event.entity.toUpperCase();
        const operation = event.operation.toLowerCase();

        const handler = getOperation(entity, operation);

        const payloadId = event.payload?._id || 'global';

        logger.verbose(`${operation} ${entity} ${payloadId} [PREPARE]`);
        logger.profile(`${operation} ${entity} ${payloadId} [DONE]`, {
          level: 'verbose',
        });

        try {
          await handler(event.payload, { bulk, ...options }, unchainedAPI);
          if (!processedOperations[entity]) processedOperations[entity] = {};
          if (!processedOperations[entity][operation]) processedOperations[entity][operation] = [];
          processedOperations[entity][operation].push(payloadId);
          logger.verbose(`${operation} ${entity} ${payloadId} [SUCCESS]`);
        } catch (e) {
          logger.verbose(`${operation} ${entity} ${payloadId} [FAILED]: ${e.message}`);
          preparationIssues.push({
            operation,
            entity,
            payloadId,
            errorCode: e.name,
            errorMessage: e.message,
          });
        } finally {
          logger.profile(`${operation} ${entity} ${payloadId} [DONE]`, {
            level: 'verbose',
          });
        }
      },
      execute: async () => {
        logger.info(`Execute bulk operations for: ${Object.keys(bulkOperations).join(', ')}`);

        const processedBulkOperations = await Promise.allSettled(
          Object.values(bulkOperations).map(async (o: any) => o.execute()),
        );
        const operationResults = {
          processedOperations,
          processedBulkOperations,
        };
        if (preparationIssues?.length) {
          logger.error(
            `${preparationIssues.length} issues occured while preparing events, import finished with errors`,
          );
          const errors = { preparationIssues };
          return [operationResults, errors];
        }
        logger.info(`Import finished without errors`);
        return [operationResults, null];
      },
      invalidateCaches: async (unchainedAPI: UnchainedCore) => {
        if (skipCacheInvalidation) return;
        await unchainedAPI.modules.assortments.invalidateCache({}, { skipUpstreamTraversal: true });
        await unchainedAPI.modules.filters.invalidateCache({}, unchainedAPI);
      },
    };
  };

  return {
    createBulkImporter,
  };
};
