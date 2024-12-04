import { mongodb } from '@unchainedshop/mongodb';
import { SearchQuery } from './search.js';

const defaultSelector = ({ includeInactive }: SearchQuery, { modules }) => {
  const selector = !includeInactive
    ? modules.products.search.buildActiveStatusFilter()
    : modules.products.search.buildActiveDraftStatusFilter();
  return selector;
};

export const resolveProductSelector = async <Product = any>(
  searchQuery: SearchQuery,
  filterActions: {
    transformProductSelector: (
      query: mongodb.Filter<Product>,
      options?: { key?: string; value?: any },
    ) => Promise<mongodb.Filter<Product>>;
  },
  unchainedAPI,
) => {
  const selector = defaultSelector(searchQuery, unchainedAPI);
  return filterActions.transformProductSelector(selector, {});
};
