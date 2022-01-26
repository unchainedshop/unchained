// import { ProductStatus } from 'meteor/unchained:core-products';
import { Context } from '@unchainedshop/types/api';
import { Query } from '@unchainedshop/types/common';
import {
  FilterAdapterActions,
  SearchQuery,
} from '@unchainedshop/types/filters';

const defaultSelector = (
  { includeInactive }: SearchQuery,
  { modules }: Context
) => {
  const selector: Query =
    modules.products.search.buildActiveDraftStatusFilter();
  if (!includeInactive) {
    selector.status = modules.products.search.buildActiveStatusFilter();
  }
  return selector;
};

export const resolveProductSelector = async (
  searchQuery: SearchQuery,
  filterActions: FilterAdapterActions,
  requestContext: Context
) => {
  const selector = defaultSelector(searchQuery, requestContext);
  return filterActions.transformProductSelector(selector);
};
