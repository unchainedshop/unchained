import { Context, Root } from '@unchainedshop/types/api';
import { log } from 'meteor/unchained:logger';
import { InvalidIdError, PaymentProviderNotFoundError } from '../../../errors';

export default async function registerPaymentCredentials(
  root: Root,
  params: { paymentProviderId: string; transactionContext: any },
  context: Context,
) {
  const { modules, services, userId } = context;
  const { paymentProviderId, transactionContext } = params;
  log(`mutation registerPaymentCredentials for ${paymentProviderId}`, {
    userId,
  });

  if (!paymentProviderId) throw new InvalidIdError({ paymentProviderId });

  if (
    !(await modules.payment.paymentProviders.providerExists({
      paymentProviderId,
    }))
  )
    throw new PaymentProviderNotFoundError({ paymentProviderId });

  return services.payment.registerPaymentCredentials(paymentProviderId, { transactionContext }, context);
}
