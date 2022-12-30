import { log } from '@unchainedshop/logger';
import { Root, Context, SortOption } from '@unchainedshop/types/api.js';
import { OrderQuery } from '@unchainedshop/types/orders.js';

export default async function orders(
  root: Root,
  params: OrderQuery & { limit?: number; offset?: number; sort?: Array<SortOption> },
  { modules, userId }: Context,
) {
  const { includeCarts, limit, offset, queryString } = params;

  log(`query orders: ${limit} ${offset} ${includeCarts} ${queryString}`, {
    userId,
  });

  return modules.orders.findOrders(params);
}
