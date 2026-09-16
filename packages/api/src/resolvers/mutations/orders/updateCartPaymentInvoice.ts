import type { Context } from '../../../context.ts';
import { PaymentProviderType } from '@unchainedshop/core-payment';
import { log } from '@unchainedshop/logger';
import { InvalidIdError, OrderNotFoundError } from '../../../errors.ts';
import { rethrowPaymentProviderServiceError } from './mapOrderServiceError.ts';

export default async function updateCartPaymentInvoice(
  root: never,
  params: { orderId: string; paymentProviderId: string; meta?: any },
  context: Context,
) {
  const { services, userId, user } = context;
  const { orderId, paymentProviderId, meta } = params;
  log(`mutation updateCartPaymentInvoice provider ${paymentProviderId}`, {
    userId,
  });

  if (!paymentProviderId) throw new InvalidIdError({ paymentProviderId });

  const order = await services.orders.findOrInitCart({
    orderId,
    user: user!,
    countryCode: context.countryCode,
  });
  if (!order) throw new OrderNotFoundError({ orderId });

  try {
    return await services.orders.selectPaymentProvider({
      orderId: order._id,
      paymentProviderId,
      expectedType: PaymentProviderType.INVOICE,
      paymentContext: { meta },
    });
  } catch (error) {
    rethrowPaymentProviderServiceError(error);
  }
}
