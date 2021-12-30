import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import { OrderPaymentStatus } from 'meteor/unchained:core-orders';
import {
  OrderNotFoundError,
  OrderWrongPaymentStatusError,
  OrderWrongStatusError,
  InvalidIdError,
} from '../../../errors';

export default async function payOrder(
  root: Root,
  { orderId }: { orderId: string },
  { modules, userId }: Context
) {
  log('mutation payOrder', { orderId, userId });

  if (!orderId) throw new InvalidIdError({ orderId });

  const order = await modules.orders.findOrder({ orderId });
  if (!order) throw new OrderNotFoundError({ orderId });

  if (modules.orders.isCart(order)) {
    throw new OrderWrongStatusError({ status: order.status });
  }

  // --> Could be bundled into one mutation (Depending on answer of status check between api and helper)
  const payment = await modules.orders.payments.findOrderPayment({
    paymentId: order.paymentId,
  });

  if (payment.status !== OrderPaymentStatus.OPEN && order.confirmed) {
    throw new OrderWrongPaymentStatusError({
      status: payment.status,
    });
  }

  await modules.orders.payments.markAsPaid(payment, null, userId);
  // <-- Bundle end

  return await modules.orders.processOrder(order, {}, userId);
}
