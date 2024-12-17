import { mongodb } from '@unchainedshop/mongodb';
import { ProductText } from '@unchainedshop/core-products';
import { AssortmentText } from '@unchainedshop/core-assortments';
import { FilterDirector, FilterAdapter, IFilterAdapter } from '@unchainedshop/core';

function escapeStringRegexp(string) {
  if (typeof string !== 'string') {
    throw new TypeError('Expected a string');
  }
  // Escape characters with special meaning either inside or outside character sets.
  // Use a simple backslash escape when it’s always valid, and a `\xnn` escape when the simpler form would be disallowed by Unicode patterns’ stricter grammar.
  return string.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&').replace(/-/g, '\\x2d');
}

const { AMAZON_DOCUMENTDB_COMPAT_MODE } = process.env;

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

        const selector: mongodb.Filter<ProductText> = AMAZON_DOCUMENTDB_COMPAT_MODE
          ? {
              $or: [
                { title: { $regex: `${escapeStringRegexp(queryString)}`, $options: 'im' } },
                { subtitle: { $regex: `${escapeStringRegexp(queryString)}`, $options: 'im' } },
                { vendor: { $regex: `${escapeStringRegexp(queryString)}`, $options: 'im' } },
                { brand: { $regex: `${escapeStringRegexp(queryString)}`, $options: 'im' } },
                { description: { $regex: `${escapeStringRegexp(queryString)}`, $options: 'im' } },
                { labels: { $regex: `${escapeStringRegexp(queryString)}`, $options: 'im' } },
              ],
            }
          : {
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

      // eslint-disable-next-line
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

FilterDirector.registerAdapter(LocalSearch);
