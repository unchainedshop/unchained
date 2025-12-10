import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import { PaymentCredentialsNotFoundError, InvalidIdError } from '../../../errors.ts';

export default async function makePaymentCredentialsPreferred(
  root: never,
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
    userId: userId!,
  });

  return modules.payment.paymentCredentials.findPaymentCredential({
    paymentCredentialsId,
  });
}
