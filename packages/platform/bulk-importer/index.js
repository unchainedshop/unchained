import { MongoInternals } from 'meteor/mongo';
import { Assortments } from 'meteor/unchained:core-assortments';
import { Filters } from 'meteor/unchained:core-filters';
import * as AssortmentHandlers from './handlers/assortment';
import * as ProductHandlers from './handlers/product';
import * as FilterHandlers from './handlers/filter';

const allowedOperations = ['create', 'remove', 'update'];

const runPrepareAsync = async (entity, operation, event, context) => {
  switch (entity) {
    case 'ASSORTMENT':
      return AssortmentHandlers[operation]?.(event.payload, context);
    case 'PRODUCT':
      return ProductHandlers[operation]?.(event.payload, context);
    case 'FILTER':
      return FilterHandlers[operation]?.(event.payload, context);
    default:
      throw new Error(`Entity ${event.entity} unknown`);
  }
};

export const createBucket = (bucketName) => {
  const options = { bucketName };
  return new MongoInternals.NpmModule.GridFSBucket(
    MongoInternals.defaultRemoteCollectionDriver().mongo.db,
    options
  );
};

export const BulkImportPayloads = createBucket('bulk_import_payloads');

export default (options) => {
  const bulkOperations = {};
  const preparationIssues = [];
  const { logger } = options;

  function bulk(Collection) {
    const raw = Collection.rawCollection();
    bulkOperations[raw.namespace.collection] =
      Collection.rawCollection().initializeOrderedBulkOp();
    return bulkOperations[raw.namespace.collection];
  }

  const context = {
    ...options,
    bulk,
  };

  logger.info(
    `Configure event import with options: createShouldUpsertIfIDExists=${options.createShouldUpsertIfIDExists}`
  );

  return {
    async prepare(event) {
      const entity = event.entity.toUpperCase();
      const operation = event.operation.toLowerCase();
      if (!allowedOperations.includes(operation)) {
        throw new Error(`Operation ${event.operation} unknown`);
      }
      if (!event.payload) {
        throw new Error(`Payload missing in ${JSON.stringify(event)}`);
      }

      logger.verbose(`${operation} ${entity} ${event.payload._id} [PREPARE]`);
      logger.profile(`${operation} ${entity} ${event.payload._id} [DONE]`, {
        level: 'verbose',
      });

      try {
        await runPrepareAsync(entity, operation, event, context);
        logger.verbose(`${operation} ${entity} ${event.payload._id} [SUCCESS]`);
      } catch (e) {
        logger.verbose(
          `${operation} ${entity} ${event.payload._id} [FAILED]: ${e.message}`
        );
        preparationIssues.push({
          operation,
          entity,
          payloadId: event.payload._id,
          errorCode: e.name,
          errorMessage: e.message,
        });
      } finally {
        logger.profile(`${operation} ${entity} ${event.payload._id} [DONE]`, {
          level: 'verbose',
        });
      }
    },
    async execute() {
      logger.info(
        `Execute bulk operations for: ${Object.keys(bulkOperations).join(', ')}`
      );
      const operationResults = Promise.all(
        Object.values(bulkOperations).map((o) => o.execute())
      );
      if (preparationIssues?.length) {
        logger.error(
          `${preparationIssues.length} issues occured while preparing events, import finished with errors`
        );
        const errors = {};
        errors.preparationIssues = preparationIssues;
        return [operationResults, errors];
      }
      logger.info(`Import finished without errors`);
      return [operationResults, null];
    },
    async invalidateCaches() {
      await Assortments.invalidateCache();
      await Filters.invalidateCache();
    },
  };
};
