import { log } from 'meteor/unchained:core-logger';
import { OrderPayments } from 'meteor/unchained:core-orders';
import { PaymentProviderType } from 'meteor/unchained:core-payment';

import {
  InvalidIdError,
  OrderPaymentNotFoundError,
  OrderPaymentTypeError,
} from '../../errors';

export default (root, { orderPaymentId, transactionContext }, { userId }) => {
  log(`mutation signPaymentProviderForCheckout ${orderPaymentId}`, {
    userId,
  });
  if (!orderPaymentId) throw new InvalidIdError({ orderPaymentId });
  const orderPayment = OrderPayments.findPayment({ orderPaymentId });
  if (!orderPayment) throw new OrderPaymentNotFoundError({ orderPaymentId });
  const providerType = orderPayment?.provider()?.type;
  if (providerType !== PaymentProviderType.GENERIC)
    throw new OrderPaymentTypeError({
      orderPaymentId,
      received: providerType,
      required: PaymentProviderType.GENERIC,
    });
  return orderPayment.sign({ transactionContext });
};
