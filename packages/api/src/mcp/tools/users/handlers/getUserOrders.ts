import type { Context } from '../../../../context.ts';
import { getNormalizedOrderDetails } from '../../../utils/getNormalizedOrderDetails.ts';
import type { Params } from '../schemas.ts';

export default async function getUserOrders(context: Context, params: Params<'GET_ORDERS'>) {
  const { modules } = context;
  const { userId, includeCarts = false, sort, queryString, status, limit = 10, offset = 0 } = params;

  const orders = await modules.orders.findOrders({
    userId,
    includeCarts,
    queryString,
    status,
    offset,
    limit,
    sort: sort?.map((s) => ({ key: s.key, value: s.value })),
  } as any);

  return {
    orders: await Promise.all(
      orders.map(async ({ _id }) => getNormalizedOrderDetails({ orderId: _id }, context)),
    ),
  };
}
