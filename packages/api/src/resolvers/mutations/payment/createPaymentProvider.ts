import type { Context } from '../../../context.ts';
import type { PaymentProvider } from '@unchainedshop/core-payment';
import { log } from '@unchainedshop/logger';
import { ProviderConfigurationInvalid } from '../../../errors.ts';
import { PaymentDirector } from '@unchainedshop/core';

export default async (
  root: never,
  { paymentProvider }: { paymentProvider: Pick<PaymentProvider, 'type' | 'adapterKey'> },
  { modules, userId }: Context,
) => {
  log('mutation createPaymentProvider', { userId });

  const Adapter = PaymentDirector.getAdapter(paymentProvider.adapterKey);
  if (!Adapter) throw new ProviderConfigurationInvalid(paymentProvider);

  return await modules.payment.paymentProviders.create({
    configuration: Adapter.initialConfiguration,
    ...paymentProvider,
  });
};
