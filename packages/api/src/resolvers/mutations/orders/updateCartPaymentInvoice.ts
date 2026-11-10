import type { Context } from '../../../context.ts';
import { PaymentProviderType } from '@unchainedshop/core-payment';
import { log } from '@unchainedshop/logger';
import { InvalidIdError, OrderPaymentNotFoundError, OrderPaymentTypeError } from '../../../errors.ts';
import type { Order } from '@unchainedshop/core-orders';
import { lockCart } from '../../loadCart.ts';

export default async function updateCartPaymentInvoice(
  root: never,
  params: { orderId: string; paymentProviderId: string; meta?: any },
  context: Context,
) {
  const { modules, services, userId } = context;
  const { orderId, paymentProviderId, meta } = params;
  log(`mutation updateCartPaymentInvoice provider ${paymentProviderId}`, {
    userId,
  });

  if (!paymentProviderId) throw new InvalidIdError({ paymentProviderId });

  await using cart = await lockCart(context, orderId);
  let order: Order = cart;

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
