import { log } from 'meteor/unchained:core-logger';
import { OrderPayments } from 'meteor/unchained:core-orders';
import { PaymentProviderType } from 'meteor/unchained:core-payment';
import {
  OrderPaymentNotFoundError,
  InvalidIdError,
  OrderPaymentTypeError,
} from '../../errors';

export default function updateOrderPaymentCard(
  root,
  { orderPaymentId, ...context },
  { userId }
) {
  log(
    `mutation updateOrderPaymentCard ${orderPaymentId} ${JSON.stringify(
      context
    )}`,
    {
      userId,
    }
  );

  if (!orderPaymentId) throw new InvalidIdError({ orderPaymentId });
  const orderPayment = OrderPayments.findPayment({ orderPaymentId });
  if (!orderPayment)
    throw new OrderPaymentNotFoundError({ data: { orderPaymentId } });
  const providerType = orderPayment?.provider()?.type;

  if (providerType !== PaymentProviderType.CARD)
    throw new OrderPaymentTypeError({
      orderPaymentId,
      received: providerType,
      required: PaymentProviderType.CARD,
    });
  return orderPayment.updateContext(context);
}
