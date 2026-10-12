import type { Context } from '../../../context.ts';
import { PaymentProviderType } from '@unchainedshop/core-payment';
import { log } from '@unchainedshop/logger';
import {
  InvalidIdError,
  OrderNotFoundError,
  OrderWrongStatusError,
  rethrowPaymentProviderError,
} from '../../../errors.ts';

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

  const order = await services.orders.findOrInitCart({
    orderId,
    user: user!,
    countryCode: context.countryCode,
  });
  if (!order) throw new OrderNotFoundError({ orderId });
  if (!modules.orders.isCart(order)) throw new OrderWrongStatusError({ status: order.status });

  await services.orders
    .selectPaymentProvider({
      order,
      paymentProviderId,
      expectedType: PaymentProviderType.GENERIC,
      paymentContext: { meta },
    })
    .catch(rethrowPaymentProviderError);
  return services.orders.updateCalculation(order._id);
}
