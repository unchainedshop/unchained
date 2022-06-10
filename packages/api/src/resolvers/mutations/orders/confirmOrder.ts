import { Context, Root } from '@unchainedshop/types/api';
import { OrderStatus } from '@unchainedshop/types/orders';
import { log } from 'meteor/unchained:logger';
import { InvalidIdError, OrderNotFoundError, OrderWrongStatusError } from '../../../errors';

export default async function confirmOrder(
  root: Root,
  params: {
    orderId: string;
    orderContext?: any;
    paymentContext?: any;
    deliveryContext?: any;
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

  return modules.orders.confirm(order._id, transactionContext, context);
}
