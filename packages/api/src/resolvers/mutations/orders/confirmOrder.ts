import { Context } from '../../../types.js';
import { OrderStatus } from '@unchainedshop/types/orders.js';
import { log } from '@unchainedshop/logger';
import { InvalidIdError, OrderNotFoundError, OrderWrongStatusError } from '../../../errors.js';

export default async function confirmOrder(
  root: never,
  params: {
    orderId: string;
    paymentContext?: any;
    deliveryContext?: any;
    comment?: string;
  },
  context: Context,
) {
  const { modules, userId } = context;
  const { orderId, ...transactionContext } = params;

  log('mutation confirmOrder', { orderId, userId });

  if (!orderId) throw new InvalidIdError({ orderId });

  const order = await modules.orders.findOrder({ orderId });
  if (!order) throw new OrderNotFoundError({ orderId });

  if (order.status !== OrderStatus.PENDING) {
    throw new OrderWrongStatusError({ status: order.status });
  }

  return modules.orders.confirm(order, transactionContext, context);
}
