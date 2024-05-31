import { Context, Root } from '@unchainedshop/types/api.js';
import { OrderStatus } from '@unchainedshop/core-orders';
import { log } from '@unchainedshop/logger';
import { InvalidIdError, OrderNotFoundError, OrderWrongStatusError } from '../../../errors.js';

export default async function rejectOrder(
  root: Root,
  params: {
    orderId: string;
    paymentContext?: any;
    deliveryContext?: any;
  },
  context: Context,
) {
  const { modules, userId } = context;
  const { orderId, ...transactionContext } = params;

  log('mutation rejectOrder', { orderId, userId });
  if (!orderId) throw new InvalidIdError({ orderId });

  const order = await modules.orders.findOrder({ orderId });
  if (!order) throw new OrderNotFoundError({ orderId });

  if (order.status !== OrderStatus.PENDING) {
    throw new OrderWrongStatusError({ status: order.status });
  }
  return modules.orders.reject(order, transactionContext, context);
}
