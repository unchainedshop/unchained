import { Context } from '../../../../context.js';
import { Params } from '../schemas.js';

export default async function getUserOrders(context: Context, params: Params<'GET_ORDERS'>) {
  const { modules } = context;
  const { userId, includeCarts = false, sort, queryString, status, limit = 10, offset = 0 } = params;

  const orders = await modules.orders.findOrders(
    {
      userId,
      includeCarts,
      queryString,
      status,
    } as any,
    {
      skip: offset,
      limit,
      sort: sort?.reduce((acc, s) => {
        acc[s.key] = s.value;
        return acc;
      }, {} as any),
    },
  );

  return { orders }
}
