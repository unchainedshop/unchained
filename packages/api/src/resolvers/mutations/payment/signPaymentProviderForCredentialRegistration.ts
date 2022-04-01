import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import { PaymentProviderNotFoundError, InvalidIdError } from '../../../errors';

export default async function signPaymentProviderForCredentialRegistration(
  root: Root,
  params: { paymentProviderId: string; transactionContext: any },
  context: Context,
) {
  const { modules, userId } = context;
  const { paymentProviderId, transactionContext } = params;

  log(`mutation signPaymentProviderForCredentialRegistration ${paymentProviderId}`, { userId });

  if (!paymentProviderId) throw new InvalidIdError({ paymentProviderId });

  if (
    !(await modules.payment.paymentProviders.providerExists({
      paymentProviderId,
    }))
  )
    throw new PaymentProviderNotFoundError({ paymentProviderId });

  return modules.payment.paymentProviders.sign(
    paymentProviderId,
    {
      transactionContext,
    },
    context,
  );
}
