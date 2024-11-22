import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { PaymentProviderNotFoundError, InvalidIdError } from '../../../errors.js';

export default async (
  root: never,
  { paymentProviderId }: { paymentProviderId: string },
  { modules, userId }: Context,
) => {
  log(`mutation removePaymentProvider ${paymentProviderId}`, { userId });

  if (!paymentProviderId) throw new InvalidIdError({ paymentProviderId });
  if (
    !(await modules.payment.paymentProviders.providerExists({
      paymentProviderId,
    }))
  )
    throw new PaymentProviderNotFoundError({ paymentProviderId });

  return modules.payment.paymentProviders.delete(paymentProviderId);
};
