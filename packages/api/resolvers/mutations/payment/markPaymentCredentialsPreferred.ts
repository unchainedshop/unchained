import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import { PaymentCredentialsNotFoundError, InvalidIdError } from '../../../errors';

export default async function makePaymentCredentialsPreferred(
  root: Root,
  { paymentCredentialsId }: { paymentCredentialsId: string },
  { modules, userId }: Context,
) {
  log(`mutation markPaymentCredentialsPreferred ${paymentCredentialsId}`, {
    userId,
  });

  if (!paymentCredentialsId) throw new InvalidIdError({ paymentCredentialsId });

  if (
    !(await modules.payment.paymentCredentials.credentialsExists({
      paymentCredentialsId,
    }))
  )
    throw new PaymentCredentialsNotFoundError({ paymentCredentialsId });

  await modules.payment.paymentCredentials.markPreferred({
    paymentCredentialsId,
    userId,
  });

  return modules.payment.paymentCredentials.findPaymentCredential({
    paymentCredentialsId,
  });
}
