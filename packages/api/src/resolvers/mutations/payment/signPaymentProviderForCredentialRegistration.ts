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

  const paymentProvider = await modules.payment.paymentProviders.findProvider({
    paymentProviderId,
  });
  if (!paymentProvider) throw new PaymentProviderNotFoundError({ paymentProviderId });

  return modules.payment.paymentProviders.sign(
    paymentProviderId,
    {
      paymentProviderId,
      paymentProvider,
      transactionContext,
    },
    context,
  );
}
