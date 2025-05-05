import { mongodb } from '@unchainedshop/mongodb';
import { ProductText } from '@unchainedshop/core-products';
import { AssortmentText } from '@unchainedshop/core-assortments';
import { FilterDirector, FilterAdapter, IFilterAdapter } from '@unchainedshop/core';
import { createLogger } from '@unchainedshop/logger';
import { isDocumentDBCompatModeEnabled } from '@unchainedshop/mongodb';

const logger = createLogger('unchained:core-filters:local-search');

const LocalSearch: IFilterAdapter = {
  ...FilterAdapter,

  key: 'shop.unchained.filters.local-search',
  label: 'Simple Fulltext search with MongoDB',
  version: '1.0.0',
  orderIndex: 10,

  actions: (params) => {
    return {
      ...FilterAdapter.actions(params),

      searchProducts: async ({ productIds }) => {
        // Search Products
        const { queryString } = params.searchQuery;

        if (!queryString) return productIds;

        const selector: mongodb.Filter<ProductText> = {
          $text: { $search: queryString },
        };

        if (productIds) {
          selector.productId = { $in: [...new Set(productIds)] as any };
        }

        const products = await params.modules.products.texts.findTexts(selector, {
          projection: {
            productId: 1,
          },
        });

        return products.map(({ productId }) => productId);
      },

      searchAssortments: async ({ assortmentIds }) => {
        const { queryString } = params.searchQuery;

        if (!queryString) {
          return assortmentIds;
        }

        const selector: mongodb.Filter<AssortmentText> = {
          $text: { $search: queryString },
        };

        if (assortmentIds) {
          selector.assortmentId = { $in: assortmentIds };
        }

        const assortments = await params.modules.assortments.texts.findTexts(selector, {
          projection: {
            assortmentId: 1,
          },
        });

        return assortments.map(({ assortmentId }) => assortmentId);
      },

      async transformFilterSelector(last) {
        const { queryString, filterIds, includeInactive } = params.searchQuery;

        if (queryString && !filterIds) {
          // Global search without assortment scope:
          // Return all filters
          const selector = { ...last };
          if (selector?.key) {
            // Do not restrict to keys
            delete selector.key;
          }
          if (!includeInactive) {
            // Include only active filters
            selector.isActive = true;
          }
          return selector;
        }

        return last;
      },
    };
  },
};

export default LocalSearch;

if (!isDocumentDBCompatModeEnabled()) {
  FilterDirector.registerAdapter(LocalSearch);
} else {
  logger.warn(
    'Free text search queries have been disabled due to DocumentDB compatibility mode (env UNCHAINED_DOCUMENTDB_COMPAT_MODE is trueish)',
  );
}
