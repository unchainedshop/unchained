import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import { PaymentProviderType } from 'meteor/unchained:core-payment';
import { OrderPaymentNotFoundError, InvalidIdError, OrderPaymentTypeError } from '../../../errors';

export default async function updateOrderPaymentInvoice(
  root: Root,
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

  await modules.orders.payments.updateContext(orderPayment._id, { meta }, context);

  return modules.orders.payments.findOrderPayment({
    orderPaymentId,
  });
}
