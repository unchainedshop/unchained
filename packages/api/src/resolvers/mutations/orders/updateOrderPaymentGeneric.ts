import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';
import { PaymentProviderType } from '@unchainedshop/core-payment';
import { OrderPaymentNotFoundError, InvalidIdError, OrderPaymentTypeError } from '../../../errors.js';

export default async function updateOrderPaymentGeneric(
  root: Root,
  { orderPaymentId, meta }: { orderPaymentId: string; meta?: any },
  context: Context,
) {
  const { modules, userId } = context;
  log(`mutation updateOrderPaymentGeneric ${orderPaymentId} ${JSON.stringify(meta)}`, {
    userId,
  });

  if (!orderPaymentId) throw new InvalidIdError({ orderPaymentId });

  const orderPayment = await modules.orders.payments.findOrderPayment({
    orderPaymentId,
  });
  if (!orderPayment) throw new OrderPaymentNotFoundError({ data: { orderPaymentId } });

  const provider = await modules.payment.paymentProviders.findProvider({
    paymentProviderId: orderPayment.paymentProviderId,
  });
  const providerType = provider?.type;

  if (providerType !== PaymentProviderType.GENERIC)
    throw new OrderPaymentTypeError({
      orderPaymentId,
      received: providerType,
      required: PaymentProviderType.GENERIC,
    });

  await modules.orders.payments.updateContext(orderPayment._id, { meta });
  await modules.orders.updateCalculation(orderPayment.orderId, context);
  return modules.orders.payments.findOrderPayment({ orderPaymentId });
}
