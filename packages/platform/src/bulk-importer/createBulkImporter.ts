import mongodb from 'mongodb';
import { BulkImportHandler, BulkImportOperation } from '@unchainedshop/types/platform';
import * as AssortmentHandlers from './handlers/assortment';
import * as FilterHandlers from './handlers/filter';
import * as ProductHandlers from './handlers/product';

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

export const createBulkImporterFactory = (db, additionalHandlers) => {
  // Increase the chunk size to 5MB to get around chunk sorting limits of mongodb (weird error above 100 MB)
  const BulkImportPayloads = new mongodb.GridFSBucket(db, {
    bucketName: 'bulk_import_payloads',
    chunkSizeBytes: 5 * 1024 * 1024,
  });

  bulkOperationHandlers = {
    ASSORTMENT: AssortmentHandlers,
    PRODUCT: ProductHandlers,
    FILTER: FilterHandlers,
    ...additionalHandlers,
  };

  const createBulkImporter = (options, requestContext) => {
    const bulkOperations = {};
    const preparationIssues = [];
    const processedOperations = {};
    const { logger, createShouldUpsertIfIDExists, skipCacheInvalidation } = options;

    const bulk = (collectionName: string) => {
      const Collection = db.collection(collectionName);
      bulkOperations[collectionName] = Collection.initializeOrderedBulkOp();
      return bulkOperations[collectionName];
    };

    logger.info(
      `Configure event import with options: createShouldUpsertIfIDExists=${createShouldUpsertIfIDExists} skipCacheInvalidation=${skipCacheInvalidation}`,
    );

    return {
      prepare: async (event) => {
        const entity = event.entity.toUpperCase();
        const operation = event.operation.toLowerCase();

        const handler = getOperation(entity, operation);

        const payloadId = event.payload?._id || 'global';

        logger.verbose(`${operation} ${entity} ${payloadId} [PREPARE]`);
        logger.profile(`${operation} ${entity} ${payloadId} [DONE]`, {
          level: 'verbose',
        });

        try {
          await handler(event.payload, { bulk, ...options }, requestContext);
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
        const operationResults = {
          processedOperations,
          processedBulkOperations: (
            await Promise.all(Object.values(bulkOperations).map((o) => o.execute()))
          ).map((r) => r.result),
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
      invalidateCaches: async () => {
        if (skipCacheInvalidation) return;
        await requestContext.modules.assortments.invalidateCache();
        await requestContext.modules.filters.invalidateCache({}, requestContext);
      },
    };
  };

  return {
    BulkImportPayloads,
    createBulkImporter,
  };
};
