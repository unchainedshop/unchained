import { log } from 'meteor/unchained:logger';
import { Root, Context } from '@unchainedshop/types/api';
import { InvalidIdError } from '../../../errors';

export default async function order(
  root: Root,
  { orderId }: { orderId: string },
  { modules, userId }: Context,
) {
  log(`query order ${orderId}`, { userId, orderId });

  if (!orderId) throw new InvalidIdError({ orderId });

  return modules.orders.findOrder({ orderId });
}
