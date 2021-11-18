import { log } from 'unchained-logger';
import { PaymentCredentials } from 'meteor/unchained:core-payment';
import { PaymentCredentialsNotFoundError, InvalidIdError } from '../../errors';

export default (root, { paymentCredentialsId }, { userId }) => {
  log(`mutation markPaymentCredentialsPreferred ${paymentCredentialsId}`, {
    userId,
  });
  if (!paymentCredentialsId) throw new InvalidIdError({ paymentCredentialsId });
  if (!PaymentCredentials.credentialsExists({ paymentCredentialsId }))
    throw new PaymentCredentialsNotFoundError({ paymentCredentialsId });
  PaymentCredentials.markPreferred({ paymentCredentialsId, userId });
  return PaymentCredentials.findCredentials({
    paymentCredentialsId,
  });
};
