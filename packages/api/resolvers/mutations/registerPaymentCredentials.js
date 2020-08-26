import { log } from 'meteor/unchained:core-logger';
import {
  PaymentCredentials,
  PaymentProviders,
} from 'meteor/unchained:core-payment';
import { PaymentProviderNotFoundError, InvalidIdError } from '../../errors';

export default (root, { paymentContext, paymentProviderId }, { userId }) => {
  log(`mutation registerPaymentCredentials for ${paymentProviderId}`, {
    userId,
  });
  if (!paymentProviderId) throw new InvalidIdError({ paymentProviderId });
  if (!PaymentProviders.find({ _id: paymentProviderId }).count())
    throw new PaymentProviderNotFoundError({ paymentProviderId });
  return PaymentCredentials.registerPaymentCredentials({
    paymentProviderId,
    paymentContext,
    userId,
  });
};
