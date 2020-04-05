import { log } from 'meteor/unchained:core-logger';
import {
  PaymentCredentials,
  PaymentProviders,
} from 'meteor/unchained:core-payment';
import { PaymentProviderNotFoundError } from '../../errors';

export default (root, { paymentContext, paymentProviderId }, { userId }) => {
  log(`mutation registerPaymentCredentials ${paymentContext}`, { userId });
  if (!PaymentProviders.find({ _id: paymentProviderId }).count())
    throw new PaymentProviderNotFoundError({ paymentProviderId });
  return PaymentCredentials.registerPaymentCredentials({
    paymentProviderId,
    paymentContext,
    userId,
  });
};
