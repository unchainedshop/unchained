import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';
import { OrderPaymentStatus } from '@unchainedshop/types/orders.payments.js';
import {
  OrderNotFoundError,
  OrderWrongPaymentStatusError,
  OrderWrongStatusError,
  InvalidIdError,
} from '../../../errors.js';

export default async function payOrder(root: Root, { orderId }: { orderId: string }, context: Context) {
  const { modules, userId } = context;

  log('mutation payOrder', { orderId, userId });

  if (!orderId) throw new InvalidIdError({ orderId });

  const order = await modules.orders.findOrder({ orderId });
  if (!order) throw new OrderNotFoundError({ orderId });

  if (modules.orders.isCart(order)) {
    throw new OrderWrongStatusError({ status: order.status });
  }

  const payment = await modules.orders.payments.findOrderPayment({
    orderPaymentId: order.paymentId,
  });

  if (modules.orders.payments.normalizedStatus(payment) !== OrderPaymentStatus.OPEN) {
    throw new OrderWrongPaymentStatusError({
      status: payment.status,
    });
  }

  await modules.orders.payments.markAsPaid(payment, null);
  return modules.orders.processOrder(order, {}, context);
}
