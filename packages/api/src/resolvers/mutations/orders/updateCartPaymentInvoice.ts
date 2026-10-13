import type { Context } from '../../../context.ts';
import { PaymentProviderType } from '@unchainedshop/core-payment';
import { log } from '@unchainedshop/logger';
import { InvalidIdError, rethrowPaymentProviderError } from '../../../errors.ts';
import loadCart from './loadCart.ts';

export default async function updateCartPaymentInvoice(
  root: never,
  params: { orderId: string; paymentProviderId: string; meta?: any },
  context: Context,
) {
  const { services, userId } = context;
  const { orderId, paymentProviderId, meta } = params;
  log(`mutation updateCartPaymentInvoice provider ${paymentProviderId}`, { userId });

  if (!paymentProviderId) throw new InvalidIdError({ paymentProviderId });

  const order = await loadCart(context, orderId);

  await services.orders
    .selectPaymentProvider({
      order,
      paymentProviderId,
      expectedType: PaymentProviderType.INVOICE,
      paymentContext: { meta },
    })
    .catch(rethrowPaymentProviderError);
  return services.orders.updateCalculation(order._id);
}
