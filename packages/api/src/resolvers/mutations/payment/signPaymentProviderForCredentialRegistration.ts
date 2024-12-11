import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';
import { PaymentProviderNotFoundError, InvalidIdError } from '../../../errors.js';
import { PaymentDirector } from '@unchainedshop/core';

export default async function signPaymentProviderForCredentialRegistration(
  root: never,
  params: { paymentProviderId: string; transactionContext: any },
  context: Context,
) {
  const { modules, userId } = context;
  const { paymentProviderId, transactionContext } = params;

  log(`mutation signPaymentProviderForCredentialRegistration ${paymentProviderId}`, { userId });

  if (!paymentProviderId) throw new InvalidIdError({ paymentProviderId });

  const provider = await modules.payment.paymentProviders.findProvider({
    paymentProviderId,
  });
  if (!provider) throw new PaymentProviderNotFoundError({ paymentProviderId });

  const actions = await PaymentDirector.actions(
    provider,
    {
      userId,
      transactionContext,
    },
    context,
  );
  return actions.sign();
}
