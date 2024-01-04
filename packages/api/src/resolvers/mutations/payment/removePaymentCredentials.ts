import { Context, Root } from '@unchainedshop/types/api.js';
import { log } from '@unchainedshop/logger';
import { InvalidIdError, PaymentCredentialsNotFoundError } from '../../../errors.js';

export default async (
  root: Root,
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
