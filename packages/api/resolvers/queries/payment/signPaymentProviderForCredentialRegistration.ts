import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import { PaymentContext } from '@unchainedshop/types/payments';
import { PaymentProviderNotFoundError, InvalidIdError } from '../../../errors';

export default async function signPaymentProviderForCredentialRegistration(
  root: Root,
  params: PaymentContext,
  { modules, userId }: Context
) {
  const { paymentProviderId } = params;

  log(
    `query signPaymentProviderForCredentialRegistration ${paymentProviderId}`,
    { userId }
  );

  if (!paymentProviderId) throw new InvalidIdError({ paymentProviderId });
  if (
    !(await modules.payment.paymentProviders.providerExists({
      paymentProviderId,
    }))
  )
    throw new PaymentProviderNotFoundError({ paymentProviderId });

  return modules.payment.paymentProviders.sign(paymentProviderId, {
    ...params,
    userId,
  });
}
