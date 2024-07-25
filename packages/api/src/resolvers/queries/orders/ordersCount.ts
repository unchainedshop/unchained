import { log } from '@unchainedshop/logger';
import { OrderQuery } from '@unchainedshop/types/orders.js';
import { Context } from '../../../types.js';

export default async function ordersCount(
  root: never,
  params: OrderQuery,
  { modules, userId }: Context,
) {
  log(`query ordersCount: ${params.includeCarts ? 'includeCart' : ''}`, { userId });

  return modules.orders.count(params);
}
