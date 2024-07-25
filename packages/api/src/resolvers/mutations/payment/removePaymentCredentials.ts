import { Context } from '../../../types.js';
import { log } from '@unchainedshop/logger';
import { InvalidIdError, PaymentCredentialsNotFoundError } from '../../../errors.js';

export default async (
  root: never,
  { paymentCredentialsId }: { paymentCredentialsId: string },
  { modules, userId }: Context,
) => {
  log(`mutation removePaymentCredentials ${paymentCredentialsId}`, { userId });

  if (!paymentCredentialsId) throw new InvalidIdError({ paymentCredentialsId });
  const removedCredentials =
    await modules.payment.paymentCredentials.removeCredentials(paymentCredentialsId);
  if (!removedCredentials) throw new PaymentCredentialsNotFoundError({ paymentCredentialsId });

  return removedCredentials;
};
