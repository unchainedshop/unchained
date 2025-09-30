import { Context } from '../../../context.js';
import { PaymentProvider } from '@unchainedshop/core-payment';
import { log } from '@unchainedshop/logger';
import { ProviderConfigurationInvalid } from '../../../errors.js';
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
