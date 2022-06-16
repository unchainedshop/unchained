import { log } from '@unchainedshop/logger';
import { Root, Context } from '@unchainedshop/types/api';
import { OrderQuery } from '@unchainedshop/types/orders';

export default async function orders(
  root: Root,
  params: OrderQuery & { limit?: number; offset?: number },
  { modules, userId }: Context,
) {
  const { includeCarts, limit, offset, queryString } = params;

  log(`query orders: ${limit} ${offset} ${includeCarts} ${queryString}`, {
    userId,
  });

  return modules.orders.findOrders(params);
}
