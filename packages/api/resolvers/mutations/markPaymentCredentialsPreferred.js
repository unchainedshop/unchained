import { log } from 'meteor/unchained:core-logger';
import { PaymentCredentials } from 'meteor/unchained:core-payment';
import { PaymentCredentialsNotFoundError, InvalidIdError } from '../../errors';

export default (root, { paymentCredentialsId }, { userId }) => {
  log(`mutation markPaymentCredentialsPreferred ${paymentCredentialsId}`, {
    userId,
  });
  if (!paymentCredentialsId) throw new InvalidIdError({ paymentCredentialsId });
  const credentials = PaymentCredentials.findCredential({
    paymentCredentialsId,
  });
  if (!credentials)
    throw new PaymentCredentialsNotFoundError({ paymentCredentialsId });
  return PaymentCredentials.markPreferred({ paymentCredentialsId, userId });
};
