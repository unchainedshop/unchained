import { FilterDirector, FilterAdapter } from '@unchainedshop/core-filters';
import { IFilterAdapter } from '@unchainedshop/types/filters.js';
import { Query } from '@unchainedshop/types/common.js';

const { AMAZON_DOCUMENTDB_COMPAT_MODE } = process.env;

const LocalSearch: IFilterAdapter = {
  ...FilterAdapter,

  key: 'shop.unchained.filters.local-search',
  label: 'Simple Fulltext search with MongoDB',
  version: '1.0.0',
  orderIndex: 1,

  actions: (params) => {
    return {
      ...FilterAdapter.actions(params),

      searchProducts: async ({ productIds }) => {
        // Search Products
        const { queryString } = params.searchQuery;

        if (!queryString) return productIds;

        const selector: Query = AMAZON_DOCUMENTDB_COMPAT_MODE
          ? {
              $or: [
                { title: { $regex: `${queryString}`, $options: 'im' } },
                { subtitle: { $regex: `${queryString}`, $options: 'im' } },
                { vendor: { $regex: `${queryString}`, $options: 'im' } },
                { brand: { $regex: `${queryString}`, $options: 'im' } },
                { description: { $regex: `${queryString}`, $options: 'im' } },
                { labels: { $regex: `${queryString}`, $options: 'im' } },
              ],
            }
          : {
              $text: { $search: queryString },
            };

        if (productIds) {
          selector.productId = { $in: [...new Set(productIds)] };
        }

        const products = await params.modules.products.texts.findTexts(selector, {
          projection: {
            productId: 1,
          },
        });

        return products.map(({ productId }) => productId);
      },

      // eslint-disable-next-line
      searchAssortments: async ({ assortmentIds }) => {
        const { queryString } = params.searchQuery;

        if (!queryString) {
          return assortmentIds;
        }

        const selector: Query = {
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
        const { query = {} } = params.searchQuery;
        const { queryString, filterIds, includeInactive } = query;

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

FilterDirector.registerAdapter(LocalSearch);
