import { OrderPaymentStatus } from '@unchainedshop/core-orders';
import type { Context } from '../../../../context.ts';
import {
  OrderNotFoundError,
  OrderPaymentNotFoundError,
  OrderWrongPaymentStatusError,
  OrderWrongStatusError,
} from '../../../../errors.ts';
import { getNormalizedOrderDetails } from '../../../utils/getNormalizedOrderDetails.ts';
import type { Params } from '../schemas.ts';

export default async function payOrder(context: Context, params: Params<'PAY_ORDER'>) {
  const { modules, services } = context;
  const { orderId } = params;

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
  await services.orders.processOrder(order, {});
  return { order: await getNormalizedOrderDetails({ orderId }, context) };
}
