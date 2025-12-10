import { PaymentCredentialsCollection } from '../db/PaymentCredentialsCollection.ts';
import { PaymentProvidersCollection } from '../db/PaymentProvidersCollection.ts';
import { configurePaymentCredentialsModule } from './configurePaymentCredentialsModule.ts';
import { configurePaymentProvidersModule } from './configurePaymentProvidersModule.ts';
import { paymentSettings, type PaymentSettingsOptions } from '../payment-settings.ts';
import type { ModuleInput } from '@unchainedshop/mongodb';

export const configurePaymentModule = async ({
  db,
  options: paymentOptions = {},
}: ModuleInput<PaymentSettingsOptions>) => {
  const PaymentProviders = await PaymentProvidersCollection(db);
  const PaymentCredentials = await PaymentCredentialsCollection(db);

  paymentSettings.configureSettings(paymentOptions);

  const paymentProviders = configurePaymentProvidersModule(PaymentProviders);
  const paymentCredentials = configurePaymentCredentialsModule(PaymentCredentials);

  return {
    paymentProviders,
    paymentCredentials,
  };
};

export type PaymentModule = Awaited<ReturnType<typeof configurePaymentModule>>;
