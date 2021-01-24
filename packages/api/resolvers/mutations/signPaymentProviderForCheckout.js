import { log } from 'meteor/unchained:core-logger';
import { OrderPayments } from 'meteor/unchained:core-orders';
import { InvalidIdError, OrderPaymentNotFoundError } from '../../errors';

export default (root, { orderPaymentId, transactionContext }, { userId }) => {
  log(`mutation signPaymentProviderForCheckout ${orderPaymentId}`, {
    userId,
  });
  if (!orderPaymentId) throw new InvalidIdError({ orderPaymentId });
  const orderPayment = OrderPayments.findPayment({ orderPaymentId });
  if (!orderPayment) throw new OrderPaymentNotFoundError({ orderPaymentId });
  return orderPayment.sign({ transactionContext });
};
