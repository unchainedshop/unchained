import { log } from 'meteor/unchained:core-logger';
import { Orders } from 'meteor/unchained:core-orders';
import { transformOrder } from '../transformations/transformOrder';
import { Root, Context } from 'unchained-core-types/api';
import { InvalidIdError } from '../../errors';

export default function order(
  root: Root,
  { orderId }: { orderId: string },
  { modules, userId }: Context
) {
  log(`query order ${orderId}`, { userId, orderId });

  if (!orderId) throw new InvalidIdError({ orderId });
  const order = (Orders as any).findOrder({ orderId })
  return transformOrder(modules)(order)
}
