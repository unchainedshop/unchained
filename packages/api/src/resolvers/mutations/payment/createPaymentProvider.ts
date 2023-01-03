import { Context, Root } from '@unchainedshop/types/api.js';
import { PaymentProvider } from '@unchainedshop/types/payments.js';
import { log } from '@unchainedshop/logger';
import { ProviderConfigurationInvalid } from '../../../errors.js';

export default async (
  root: Root,
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
