import { Context } from '../../../context.js';
import { PaymentProviderType } from '@unchainedshop/core-payment';
import { log } from '@unchainedshop/logger';
import {
  InvalidIdError,
  OrderNotFoundError,
  OrderPaymentNotFoundError,
  OrderPaymentTypeError,
  OrderWrongStatusError,
} from '../../../errors.js';

export default async function updateCartPaymentInvoice(
  root: never,
  params: { orderId: string; paymentProviderId: string; meta?: any },
  context: Context,
) {
  const { modules, services, userId, user } = context;
  const { orderId, paymentProviderId, meta } = params;
  log(`mutation updateCartPaymentInvoice provider ${paymentProviderId}`, {
    userId,
  });

  if (!paymentProviderId) throw new InvalidIdError({ paymentProviderId });

  let order = await services.orders.findOrInitCart({
    orderId,
    user: user!,
    countryCode: context.countryCode,
  });
  if (!order) throw new OrderNotFoundError({ orderId });
  if (!modules.orders.isCart(order)) throw new OrderWrongStatusError({ status: order.status });

  const provider = await modules.payment.paymentProviders.findProvider({
    paymentProviderId,
  });
  const paymentProviderType = provider?.type;

  if (paymentProviderType !== PaymentProviderType.INVOICE)
    throw new OrderPaymentTypeError({
      orderId: order._id,
      received: paymentProviderType,
      required: PaymentProviderType.INVOICE,
    });

  order = (await modules.orders.setPaymentProvider(order._id, paymentProviderId)) || order;

  if (!order.paymentId) throw new OrderPaymentNotFoundError({ orderId: order._id });

  await modules.orders.payments.updateContext(order.paymentId, {
    meta,
  });
  return services.orders.updateCalculation(order._id);
}
