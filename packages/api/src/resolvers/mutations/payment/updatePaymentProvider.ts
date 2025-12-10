import type { Context } from '../../../context.ts';
import type { PaymentProvider } from '@unchainedshop/core-payment';
import { log } from '@unchainedshop/logger';
import { PaymentProviderNotFoundError, InvalidIdError } from '../../../errors.ts';

export default async (
  root: never,
  {
    paymentProviderId,
    paymentProvider,
  }: { paymentProviderId: string; paymentProvider: PaymentProvider },
  { modules, userId }: Context,
) => {
  log(`mutation updatePaymentProvider ${paymentProviderId}`, { userId });

  if (!paymentProviderId) throw new InvalidIdError({ paymentProviderId });
  if (
    !(await modules.payment.paymentProviders.providerExists({
      paymentProviderId,
    }))
  )
    throw new PaymentProviderNotFoundError({ paymentProviderId });

  return modules.payment.paymentProviders.update(paymentProviderId, paymentProvider);
};
