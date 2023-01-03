import { log } from '@unchainedshop/logger';
import { Root, Context } from '@unchainedshop/types/api.js';
import { OrderQuery } from '@unchainedshop/types/orders.js';

export default async function ordersCount(root: Root, params: OrderQuery, { modules, userId }: Context) {
  log(`query ordersCount: ${params.includeCarts ? 'includeCart' : ''}`, { userId });

  return modules.orders.count(params);
}
