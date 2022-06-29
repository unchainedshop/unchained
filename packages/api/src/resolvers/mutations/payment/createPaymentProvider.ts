import { Context, Root } from '@unchainedshop/types/api';
import { PaymentProvider } from '@unchainedshop/types/payments';
import { log } from '@unchainedshop/logger';
import { ProviderConfigurationInvalid } from '../../../errors';

export default async (
  root: Root,
  { paymentProvider }: { paymentProvider: PaymentProvider },
  { modules, userId }: Context,
) => {
  log('mutation createPaymentProvider', { userId });

  const provider = await modules.payment.paymentProviders.create(
    {
      ...paymentProvider,
      authorId: userId,
    },
    userId,
  );

  if (!provider) throw new ProviderConfigurationInvalid(paymentProvider);

  return provider;
};
