import { mongodb } from '@unchainedshop/mongodb';
import { type ProductText } from '@unchainedshop/core-products';
import { FilterDirector, FilterAdapter, type IFilterAdapter } from '@unchainedshop/core';
import { createLogger } from '@unchainedshop/logger';
import { isDocumentDBCompatModeEnabled } from '@unchainedshop/mongodb';

const logger = createLogger('unchained:local-search');

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

        // TODO: Implement SQLite-based text search
        // For now, return all assortmentIds when there's a search query
        // since $text search is not available in SQLite
        const assortments = await params.modules.assortments.texts.findTexts({
          assortmentIds,
        });

        // Simple text matching (case-insensitive) until FTS is implemented
        // Normalize hyphens to spaces for flexible matching
        const matchingAssortments = assortments.filter((text) => {
          const searchLower = queryString.toLowerCase().replace(/-/g, ' ');
          const normalizeText = (t?: string) => t?.toLowerCase().replace(/-/g, ' ');
          return (
            normalizeText(text.title)?.includes(searchLower) ||
            normalizeText(text.subtitle)?.includes(searchLower) ||
            normalizeText(text.description)?.includes(searchLower)
          );
        });

        return matchingAssortments.map(({ assortmentId }) => assortmentId);
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
