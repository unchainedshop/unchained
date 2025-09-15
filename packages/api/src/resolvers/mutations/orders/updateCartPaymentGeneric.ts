import { Context } from '../../../context.js';
import { PaymentProviderType } from '@unchainedshop/core-payment';
import { log } from '@unchainedshop/logger';
import {
  InvalidIdError,
  OrderNotFoundError,
  OrderPaymentTypeError,
  OrderWrongStatusError,
} from '../../../errors.js';

export default async function updateCartPaymentGeneric(
  root: never,
  params: { orderId: string; paymentProviderId: string; meta?: any },
  context: Context,
) {
  const { modules, services, userId, user } = context;
  const { orderId, paymentProviderId, meta } = params;
  log(`mutation updateCartPaymentGeneric provider ${paymentProviderId}`, {
    userId,
  });

  if (!paymentProviderId) throw new InvalidIdError({ paymentProviderId });

  let order = await services.orders.findOrInitCart({
    orderId,
    user,
    countryCode: context.countryCode,
  });
  if (!order) throw new OrderNotFoundError({ orderId });
  if (!modules.orders.isCart(order)) throw new OrderWrongStatusError({ status: order.status });

  const provider = await modules.payment.paymentProviders.findProvider({
    paymentProviderId,
  });
  const paymentProviderType = provider?.type;

  if (paymentProviderType !== PaymentProviderType.GENERIC)
    throw new OrderPaymentTypeError({
      orderId: order._id,
      received: paymentProviderType,
      required: PaymentProviderType.GENERIC,
    });

  order = (await modules.orders.setPaymentProvider(order._id, paymentProviderId)) || order;

  await modules.orders.payments.updateContext(order.paymentId, {
    meta,
  });
  return services.orders.updateCalculation(order._id);
}
