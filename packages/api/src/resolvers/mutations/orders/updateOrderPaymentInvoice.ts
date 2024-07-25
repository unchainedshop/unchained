import { log } from '@unchainedshop/logger';
import { Context } from '../../../types.js';
import { PaymentProviderType } from '@unchainedshop/core-payment';
import { OrderPaymentNotFoundError, InvalidIdError, OrderPaymentTypeError } from '../../../errors.js';

export default async function updateOrderPaymentInvoice(
  root: never,
  { orderPaymentId, meta }: { orderPaymentId: string; meta?: any },
  context: Context,
) {
  const { modules, userId } = context;
  log(`mutation updateOrderPaymentInvoice ${orderPaymentId} ${JSON.stringify(meta)}`, {
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

  if (providerType !== PaymentProviderType.INVOICE)
    throw new OrderPaymentTypeError({
      orderPaymentId,
      received: providerType,
      required: PaymentProviderType.INVOICE,
    });

  await modules.orders.payments.updateContext(orderPayment._id, { meta });
  await modules.orders.updateCalculation(orderPayment.orderId, context);
  return modules.orders.payments.findOrderPayment({ orderPaymentId });
}
