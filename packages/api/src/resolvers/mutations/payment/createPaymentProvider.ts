import { Context } from '../../../context.js';
import { PaymentProvider } from '@unchainedshop/core-payment';
import { log } from '@unchainedshop/logger';
import { ProviderConfigurationInvalid } from '../../../errors.js';

export default async (
  root: never,
  { paymentProvider }: { paymentProvider: PaymentProvider },
  { modules, userId }: Context,
) => {
  log('mutation createPaymentProvider', { userId });

  const provider = await modules.payment.paymentProviders.create({
    ...paymentProvider,
  });

  if (!provider) throw new ProviderConfigurationInvalid(paymentProvider);

  return provider;
};
