import { log } from '@unchainedshop/logger';
import { InvalidIdError } from '../../../errors.js';
import { Context } from '../../../types.js';

export default async function order(
  root: never,
  { orderId }: { orderId: string },
  { modules, userId }: Context,
) {
  log(`query order ${orderId}`, { userId, orderId });

  if (!orderId) throw new InvalidIdError({ orderId });

  return modules.orders.findOrder({ orderId });
}
