import { Context, Root } from '@unchainedshop/types/api';
import { PaymentContext } from '@unchainedshop/types/payments';
import { log } from 'meteor/unchained:logger';
import { InvalidIdError, PaymentProviderNotFoundError } from '../../../errors';

export default async function registerPaymentCredentials(
  root: Root,
  {
    paymentContext,
    paymentProviderId,
  }: { paymentContext: PaymentContext; paymentProviderId: string },
  context: Context
) {
  const { modules, services, userId } = context;
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

  return await services.payment.registerPaymentCredentials(
    {
      paymentProviderId,
      paymentContext: {
        transactionContext: paymentContext,
      },
    },
    context
  );
}
