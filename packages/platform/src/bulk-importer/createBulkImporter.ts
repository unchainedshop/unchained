import { mongodb } from '@unchainedshop/mongodb';
import { BulkImporter, UnchainedCore } from '@unchainedshop/core';
import * as AssortmentHandlers from './handlers/assortment/index.js';
import * as FilterHandlers from './handlers/filter/index.js';
import * as ProductHandlers from './handlers/product/index.js';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:bulk-import');

export interface BulkImportOperationResult {
  entity: string;
  operation: string;
  success: boolean;
}
export type BulkImportOperation = (
  payload: any,
  options: {
    bulk: (collection: string) => typeof mongodb.BulkOperationBase;
    createShouldUpsertIfIDExists?: boolean;
    updateShouldUpsertIfIDNotExists?: boolean;
    skipCacheInvalidation?: boolean;
  },
  unchainedAPI: UnchainedCore,
) => Promise<BulkImportOperationResult>;

export type BulkImportHandler = Record<string, BulkImportOperation>;

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
    const { createShouldUpsertIfIDExists, skipCacheInvalidation, updateShouldUpsertIfIDNotExists } =
      options;

    const bulk = (collectionName: string) => {
      const Collection = db.collection(collectionName);
      if (!bulkOperations[collectionName])
        bulkOperations[collectionName] = Collection.initializeOrderedBulkOp();
      return bulkOperations[collectionName];
    };

    logger.debug(
      `Configure event import with options: createShouldUpsertIfIDExists=${createShouldUpsertIfIDExists} updateShouldUpsertIfIDNotExists=${updateShouldUpsertIfIDNotExists} skipCacheInvalidation=${skipCacheInvalidation}`,
    );

    return {
      prepare: async (event, unchainedAPI: UnchainedCore) => {
        const entity = event.entity.toUpperCase();
        const operation = event.operation.toLowerCase();

        const handler = getOperation(entity, operation);

        const payloadId = event.payload?._id || 'global';

        logger.debug(`${operation} ${entity} ${payloadId} [PREPARE]`);

        try {
          await handler(event.payload, { bulk, logger, ...options }, unchainedAPI);
          if (!processedOperations[entity]) processedOperations[entity] = {};
          if (!processedOperations[entity][operation]) processedOperations[entity][operation] = [];
          processedOperations[entity][operation].push(payloadId);
          logger.debug(`${operation} ${entity} ${payloadId} [SUCCESS]`);
        } catch (e) {
          logger.debug(`${operation} ${entity} ${payloadId} [FAILED]`, e);
          preparationIssues.push({
            operation,
            entity,
            payloadId,
            errorCode: e.name,
            errorMessage: e.message,
          });
        } finally {
          logger.debug(`${operation} ${entity} ${payloadId} [DONE]`);
        }
      },
      execute: async () => {
        logger.debug(`Execute bulk operations for: ${Object.keys(bulkOperations).join(', ')}`);

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
        logger.debug(`Import finished without errors`);
        return [operationResults, null];
      },
      invalidateCaches: async (unchainedAPI: UnchainedCore) => {
        if (skipCacheInvalidation) return;
        await unchainedAPI.modules.assortments.invalidateCache({}, { skipUpstreamTraversal: true });
        await unchainedAPI.services.filters.invalidateFilterCache();
      },
    };
  };

  return {
    createBulkImporter,
  };
};

export { AssortmentHandlers, ProductHandlers, FilterHandlers };
