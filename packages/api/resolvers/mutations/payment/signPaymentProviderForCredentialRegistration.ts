import { Context, Root } from '@unchainedshop/types/api';
import { PaymentProvider } from '@unchainedshop/types/payments';
import { log } from 'meteor/unchained:logger';
import { PaymentProviderNotFoundError, InvalidIdError } from '../../../errors';

export default async (
  root: Root,
  { paymentProviderId, ...paymentProvider }: { paymentProviderId: string } & PaymentProvider,
  { modules, userId }: Context,
) => {
  log(`mutation signPaymentProviderForCredentialRegistration ${paymentProviderId}`, { userId });

  if (!paymentProviderId) throw new InvalidIdError({ paymentProviderId });
  if (
    !(await modules.payment.paymentProviders.findProvider({
      paymentProviderId,
    }))
  )
    throw new PaymentProviderNotFoundError({ paymentProviderId });

  return modules.payment.paymentProviders.sign(paymentProviderId, {
    userId,
    paymentProviderId,
    transactionContext: paymentProvider,
  });
};
