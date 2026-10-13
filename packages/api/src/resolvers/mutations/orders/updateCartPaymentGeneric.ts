import type { Context } from '../../../context.ts';
import { PaymentProviderType } from '@unchainedshop/core-payment';
import { log } from '@unchainedshop/logger';
import { InvalidIdError, mapServiceError, paymentProviderErrors } from '../../../errors.ts';
import { lockCart } from '../../loadCart.ts';

export default async function updateCartPaymentGeneric(
  root: never,
  params: { orderId: string; paymentProviderId: string; meta?: any },
  context: Context,
) {
  const { services, userId } = context;
  const { orderId, paymentProviderId, meta } = params;
  log(`mutation updateCartPaymentGeneric provider ${paymentProviderId}`, { userId });

  if (!paymentProviderId) throw new InvalidIdError({ paymentProviderId });

  await using order = await lockCart(context, orderId);

  try {
    await services.orders.selectPaymentProvider({
      order,
      paymentProviderId,
      expectedType: PaymentProviderType.GENERIC,
      paymentContext: { meta },
    });
  } catch (error) {
    throw mapServiceError(error, paymentProviderErrors);
  }
  return await services.orders.updateCalculation(order._id);
}
