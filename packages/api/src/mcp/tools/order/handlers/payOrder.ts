import { OrderPaymentStatus } from '@unchainedshop/core-orders';
import { Context } from '../../../../context.js';
import {
  OrderNotFoundError,
  OrderWrongPaymentStatusError,
  OrderWrongStatusError,
} from '../../../../errors.js';
import { getNormalizedOrderDetails } from '../../../utils/getNormalizedOrderDetails.js';
import { Params } from '../schemas.js';

export default async function payOrder(context: Context, params: Params<'PAY_ORDER'>) {
  const { modules, services } = context;
  const { orderId } = params;

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
  await services.orders.processOrder(order, {});
  return { order: await getNormalizedOrderDetails({ orderId }, context) };
}
