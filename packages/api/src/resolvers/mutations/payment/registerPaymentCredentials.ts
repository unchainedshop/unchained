import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { InvalidIdError, PaymentProviderNotFoundError } from '../../../errors.js';

export default async function registerPaymentCredentials(
  root: never,
  params: { paymentProviderId: string; transactionContext: any },
  context: Context,
) {
  const { modules, services, userId } = context;
  const { paymentProviderId, transactionContext } = params;
  log(`mutation registerPaymentCredentials for ${paymentProviderId}`, {
    userId,
  });

  if (!paymentProviderId) throw new InvalidIdError({ paymentProviderId });

  const paymentProvider = await modules.payment.paymentProviders.findProvider({ paymentProviderId });
  if (!paymentProvider) throw new PaymentProviderNotFoundError({ paymentProviderId });

  return services.orders.registerPaymentCredentials(paymentProviderId, {
    transactionContext,
    userId: context.userId,
  });
}
