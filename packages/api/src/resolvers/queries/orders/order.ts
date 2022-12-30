import { log } from '@unchainedshop/logger';
import { Root, Context } from '@unchainedshop/types/api.js';
import { InvalidIdError } from '../../../errors.js';

export default async function order(
  root: Root,
  { orderId }: { orderId: string },
  { modules, userId }: Context,
) {
  log(`query order ${orderId}`, { userId, orderId });

  if (!orderId) throw new InvalidIdError({ orderId });

  return modules.orders.findOrder({ orderId });
}
