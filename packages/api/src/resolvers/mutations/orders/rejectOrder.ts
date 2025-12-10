import type { Context } from '../../../context.ts';
import { OrderStatus } from '@unchainedshop/core-orders';
import { log } from '@unchainedshop/logger';
import { InvalidIdError, OrderNotFoundError, OrderWrongStatusError } from '../../../errors.ts';

export default async function rejectOrder(
  root: never,
  params: {
    orderId: string;
    paymentContext?: any;
    deliveryContext?: any;
    comment?: string;
  },
  context: Context,
) {
  const { modules, services, userId } = context;
  const { orderId, ...transactionContext } = params;

  log('mutation rejectOrder', { orderId, userId });

  if (!orderId) throw new InvalidIdError({ orderId });

  const order = await modules.orders.findOrder({ orderId });
  if (!order) throw new OrderNotFoundError({ orderId });

  if (order.status !== OrderStatus.PENDING) {
    throw new OrderWrongStatusError({ status: order.status });
  }
  return services.orders.rejectOrder(order, transactionContext);
}
