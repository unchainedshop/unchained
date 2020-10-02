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

export default ({ logger, authorId }) => {
  const bulkOperations = {};
  function bulk(Collection) {
    const raw = Collection.rawCollection();
    bulkOperations[
      raw.namespace.collection
    ] = Collection.rawCollection().initializeOrderedBulkOp();
    return bulkOperations[raw.namespace.collection];
  }

  const context = {
    logger,
    bulk,
    authorId,
  };

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

      logger.info(`${operation} ${entity} ${event.payload._id} [START]`);
      logger.profile(`${operation} ${entity} ${event.payload._id} [DONE]`);
      return runPrepareAsync(entity, operation, event, context).finally(() => {
        logger.profile(`${operation} ${entity} ${event.payload._id} [DONE]`);
      });
    },
    async execute() {
      logger.verbose(
        `execute bulk operations for: ${Object.keys(bulkOperations).join(', ')}`
      );
      const operationResults = Promise.all(
        Object.values(bulkOperations).map((o) => o.execute())
      );
      return { operationResults };
    },
  };
};
