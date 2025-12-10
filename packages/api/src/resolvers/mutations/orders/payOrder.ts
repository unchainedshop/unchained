import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import { OrderPaymentStatus } from '@unchainedshop/core-orders';
import {
  OrderNotFoundError,
  OrderWrongPaymentStatusError,
  OrderWrongStatusError,
  InvalidIdError,
  OrderPaymentNotFoundError,
} from '../../../errors.ts';

export default async function payOrder(root: never, { orderId }: { orderId: string }, context: Context) {
  const { modules, services, userId } = context;

  log('mutation payOrder', { orderId, userId });

  if (!orderId) throw new InvalidIdError({ orderId });

  const order = await modules.orders.findOrder({ orderId });
  if (!order) throw new OrderNotFoundError({ orderId });

  if (modules.orders.isCart(order)) {
    throw new OrderWrongStatusError({ status: order.status });
  }

  const payment =
    order.paymentId &&
    (await modules.orders.payments.findOrderPayment({
      orderPaymentId: order.paymentId,
    }));

  if (!payment) throw new OrderPaymentNotFoundError({ orderPaymentId: order.paymentId });

  if (modules.orders.payments.normalizedStatus(payment) !== OrderPaymentStatus.OPEN) {
    throw new OrderWrongPaymentStatusError({
      status: payment.status,
    });
  }

  await modules.orders.payments.markAsPaid(payment, null);
  return services.orders.processOrder(order, {});
}
