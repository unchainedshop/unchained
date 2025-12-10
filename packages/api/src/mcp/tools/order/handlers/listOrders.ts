import type { Context } from '../../../../context.ts';
import { getNormalizedOrderDetails } from '../../../utils/getNormalizedOrderDetails.ts';
import { resolveOrderFilters } from '../../../utils/orderFilters.ts';
import type { Params } from '../schemas.ts';

export default async function listOrders(context: Context, params: Params<'LIST'>) {
  const { modules } = context;
  const {
    limit = 10,
    offset = 0,
    includeCarts = false,
    queryString,
    status,
    sort,
    paymentProviderTypes = [],
    deliveryProviderTypes = [],
    paymentProviderIds = [],
    deliveryProviderIds = [],
    dateRange,
  } = params as any;

  const filters = await resolveOrderFilters(modules, {
    paymentProviderIds: [...paymentProviderIds, ...paymentProviderTypes],
    deliveryProviderIds: [...deliveryProviderIds, ...deliveryProviderTypes],
  });

  if (!filters) {
    return { orders: [] };
  }

  const sortOptions = sort?.map((s) => ({ key: s.key, value: s.value as any })) || undefined;

  const findOptions = {
    queryString,
    includeCarts,
    status,
    dateRange,
    ...filters,
  } as any;

  const orders = await modules.orders.findOrders(findOptions, {
    limit,
    skip: offset,
    sort: sortOptions as any,
  });

  return {
    orders: await Promise.all(
      orders?.map(async ({ _id }) => getNormalizedOrderDetails({ orderId: _id }, context)),
    ),
  };
}
