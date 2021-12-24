import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';

import { PaymentProviderNotFoundError, InvalidIdError } from '../../../errors';
import { PaymentContext } from '@unchainedshop/types/payments';
import user from 'resolvers/queries/users/user';

export default async function registerPaymentCredentials(
  root: Root,
  {
    paymentContext,
    paymentProviderId,
  }: { paymentContext: PaymentContext; paymentProviderId: string },
  context: Context
) {
  const { modules, userId } = context;
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

  return await modules.payment.paymentProviders.register(
    paymentProviderId,
    paymentContext,
    context
  );
}
