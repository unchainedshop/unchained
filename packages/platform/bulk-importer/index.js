import * as AssortmentHandlers from './handlers/assortment';
import * as ProductHandlers from './handlers/product';
import * as FilterHandlers from './handlers/filter';

export default ({ logger }) => {
  const bulkOperations = {};
  function getBulkOperation(Collection) {
    bulkOperations.a = Collection.rawCollection().initializeOrderedBulkOp;
    return bulkOperations.a;
  }

  const context = {
    logger,
    getBulkOperation,
  };

  return {
    prepare(event) {
      logger.verbose('prepare event', event);
      switch (event.entity) {
        case 'ASSORTMENT':
          return AssortmentHandlers[event.operation](event, context);
        case 'PRODUCT':
          return ProductHandlers[event.operation](event, context);
        case 'FILTER':
          return FilterHandlers[event.operation](event, context);
        default:
          throw new Error(`Entity ${event.entity} unknown`);
      }
    },
    async execute() {
      logger.verbose(
        `execute bulk operations for: ${Object.keys(bulkOperations).join(
          ', ',
        )}`,
      );
      return Promise.all(Object.values(bulkOperations).map((o) => o.execute()));
    },
  };
};
