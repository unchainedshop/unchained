import { log } from 'meteor/unchained:core-logger';
import { OrderPayments } from 'meteor/unchained:core-orders';
import { PaymentProviderType } from 'meteor/unchained:core-payment';
import {
  OrderPaymentNotFoundError,
  InvalidIdError,
  OrderPaymentTypeError,
} from '../../errors';

export default function updateOrderPaymentGeneric(
  root,
  { orderPaymentId, ...context },
  { userId }
) {
  log(
    `mutation updateOrderPaymentGeneric ${orderPaymentId} ${JSON.stringify(
      context
    )}`,
    {
      userId,
    }
  );

  if (!orderPaymentId) throw new InvalidIdError({ orderPaymentId });
  const orderPayment = OrderPayments.findOne({ _id: orderPaymentId });
  if (!orderPayment)
    throw new OrderPaymentNotFoundError({ data: { orderPaymentId } });
  const providerType = orderPayment?.provider()?.type;

  if (providerType !== PaymentProviderType.GENERIC)
    throw new OrderPaymentTypeError({
      orderPaymentId,
      received: providerType,
      required: PaymentProviderType.GENERIC,
    });
  return orderPayment.updateContext(context);
}
