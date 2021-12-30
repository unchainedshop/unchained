import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import { PaymentProviderType } from 'meteor/unchained:core-payment';

import {
  InvalidIdError,
  OrderPaymentConfigurationError,
  OrderPaymentNotFoundError,
  OrderPaymentTypeError,
} from '../../../errors';

export default (root: Root, { orderPaymentId, transactionContext }, { userId }) => {
  log(`mutation signPaymentProviderForCheckout ${orderPaymentId}`, {
    userId,
  });
  if (!orderPaymentId) throw new InvalidIdError({ orderPaymentId });
  const orderPayment = await modules.orders.payments.findPayment({ orderPaymentId });
  if (!orderPayment) throw new OrderPaymentNotFoundError({ orderPaymentId });
  const providerType = orderPayment?.provider()?.type;
  if (providerType !== PaymentProviderType.GENERIC)
    throw new OrderPaymentTypeError({
      orderPaymentId,
      received: providerType,
      required: PaymentProviderType.GENERIC,
    });

  try {
    return orderPayment.sign({ transactionContext });
  } catch (error) {
    throw new OrderPaymentConfigurationError(error);
  }
};
