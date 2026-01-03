import type { Modules } from '../modules.ts';
import { SearchDirector, SearchEntityType } from '../directors/index.ts';
import type { DeliveryProviderQuery } from '@unchainedshop/core-delivery';

export async function searchDeliveryProvidersService(
  this: Modules,
  queryString?: string,
  query: DeliveryProviderQuery = {},
) {
  if (!queryString) {
    return this.delivery.findProviders(query);
  }

  const searchActions = SearchDirector.actions({ queryString }, { modules: this });
  const searchDeliveryProviderIds = await searchActions.search(SearchEntityType.DELIVERY_PROVIDER);
  if (searchDeliveryProviderIds.length === 0) return [];

  return this.delivery.findProviders({ ...query, searchDeliveryProviderIds });
}

export async function searchDeliveryProvidersCountService(
  this: Modules,
  queryString?: string,
  query: DeliveryProviderQuery = {},
) {
  if (!queryString) {
    return this.delivery.count(query);
  }

  const searchActions = SearchDirector.actions({ queryString }, { modules: this });
  const searchDeliveryProviderIds = await searchActions.search(SearchEntityType.DELIVERY_PROVIDER);
  if (searchDeliveryProviderIds.length === 0) return 0;

  return this.delivery.count({ ...query, searchDeliveryProviderIds });
}
