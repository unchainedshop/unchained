import { log } from 'meteor/unchained:logger';
import { Orders } from 'meteor/unchained:core-orders';
import { Root, Context } from 'unchained-core-types/api';
import { InvalidIdError } from '../../errors';

export default function order(
  root: Root,
  { orderId }: { orderId: string },
  { userId }: Context
) {
  log(`query order ${orderId}`, { userId, orderId });

  if (!orderId) throw new InvalidIdError({ orderId });
  return (Orders as any).findOrder({ orderId });
}
