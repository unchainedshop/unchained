// import { ProductStatus } from 'meteor/unchained:core-products';
import { Context } from '@unchainedshop/types/api';
import { Query } from '@unchainedshop/types/common';
import { FilterAdapterActions, SearchQuery } from '@unchainedshop/types/filters';

const defaultSelector = ({ includeInactive }: SearchQuery, { modules }: Context) => {
  const selector: Query = !includeInactive
    ? modules.products.search.buildActiveStatusFilter()
    : modules.products.search.buildActiveDraftStatusFilter();
  return selector;
};

export const resolveProductSelector = async (
  searchQuery: SearchQuery,
  filterActions: FilterAdapterActions,
  requestContext: Context,
) => {
  const selector = defaultSelector(searchQuery, requestContext);
  return filterActions.transformProductSelector(selector, {});
};
