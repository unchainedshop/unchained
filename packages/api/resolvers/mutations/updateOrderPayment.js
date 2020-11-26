import { log } from 'meteor/unchained:core-logger';
import {
  OrderPayments,
  PaymentProviderType,
} from 'meteor/unchained:core-orders';
import {
  OrderPaymentNotFoundError,
  InvalidIdError,
  OrderPaymentTypeError,
} from '../../errors';

const PAYMENT_UPDATE_ENDPOINT = {
  updateOrderPaymentCard: PaymentProviderType.CARD,
  updateOrderPaymentInvoice: PaymentProviderType.INVOICE,
  updateOrderPaymentGeneric: PaymentProviderType.GENERIC,
};

export default function updateOrderPayment(
  root,
  { orderPaymentId, ...context },
  { userId },
  { fieldName }
) {
  log(
    `mutation updateOrderPayment ${orderPaymentId} ${JSON.stringify(
      fieldName
    )}`,
    {
      userId,
    }
  );

  if (!orderPaymentId) throw new InvalidIdError({ orderPaymentId });
  const orderPayment = OrderPayments.findOne({ _id: orderPaymentId });
  if (!orderPayment)
    throw new OrderPaymentNotFoundError({ data: { orderPaymentId } });
  if (orderPayment.provider.type !== PAYMENT_UPDATE_ENDPOINT[fieldName])
    throw new OrderPaymentTypeError({
      orderPaymentId,
      recieved: orderPayment.provider.type,
      required: PAYMENT_UPDATE_ENDPOINT[fieldName],
    });
  return orderPayment.updateContext(context);
}
