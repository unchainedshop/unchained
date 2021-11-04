import { log } from 'meteor/unchained:core-logger';
import { Orders } from 'meteor/unchained:core-orders';
import { Root, Context } from 'unchained-core-types/api';
import { InvalidIdError } from '../../errors';

export const mapOrder = (modules) => (order) => ({
  ...order,
  logs: async ({ limit, offset }) => {
    return await modules.logger.findLogs(
      { 'meta.orderId': order._id },
      {
        skip: offset,
        limit,
        sort: {
          created: -1,
        },
      }
    );
  },
});

export default function order(
  root: Root,
  { orderId }: { orderId: string },
  { modules, userId }: Context
) {
  log(`query order ${orderId}`, { userId, orderId });

  if (!orderId) throw new InvalidIdError({ orderId });
  const order = (Orders as any).findOrder({ orderId })
  return mapOrder(modules)(order)
}
