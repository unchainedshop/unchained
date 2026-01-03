import type { Modules } from '../modules.ts';
import { SearchDirector } from '../directors/index.ts';
import type { OrderQuery } from '@unchainedshop/core-orders';

export async function searchOrdersService(
  this: Modules,
  queryString?: string,
  query: OrderQuery = {},
  options: { locale?: Intl.Locale; userId?: string } = {},
) {
  if (!queryString) {
    return this.orders.findOrders(query);
  }

  const searchActions = SearchDirector.actions(
    { queryString, locale: options.locale, userId: options.userId },
    { modules: this },
  );
  const searchOrderIds = await searchActions.searchOrders();
  if (searchOrderIds.length === 0) return [];

  return this.orders.findOrders({ ...query, searchOrderIds });
}
