import { log } from '@unchainedshop/logger';
import { SortOption } from '@unchainedshop/utils';
import { OrderQuery } from '@unchainedshop/types/orders.js';
import { Context } from '../../../types.js';

export default async function orders(
  root: never,
  params: OrderQuery & { limit?: number; offset?: number; sort?: Array<SortOption> },
  { modules, userId }: Context,
) {
  const { includeCarts, limit, offset, queryString } = params;

  log(`query orders: ${limit} ${offset} ${includeCarts} ${queryString}`, {
    userId,
  });

  return modules.orders.findOrders(params);
}
