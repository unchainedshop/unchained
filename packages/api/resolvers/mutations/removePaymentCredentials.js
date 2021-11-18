import { log } from 'unchained-logger';
import { PaymentCredentials } from 'meteor/unchained:core-payment';
import { InvalidIdError, PaymentCredentialsNotFoundError } from '../../errors';

export default (root, { paymentCredentialsId }, { userId }) => {
  log(`mutation removePaymentCredentials ${paymentCredentialsId}`, { userId });
  if (!paymentCredentialsId) throw new InvalidIdError({ paymentCredentialsId });
  const removedCredentials = PaymentCredentials.removeCredentials({
    paymentCredentialsId,
  });
  if (!removedCredentials)
    throw new PaymentCredentialsNotFoundError({ paymentCredentialsId });
  return removedCredentials;
};
