import { PaymentCredentialsCollection } from '../db/PaymentCredentialsCollection.js';
import { PaymentProvidersCollection } from '../db/PaymentProvidersCollection.js';
import { configurePaymentCredentialsModule } from './configurePaymentCredentialsModule.js';
import { configurePaymentProvidersModule } from './configurePaymentProvidersModule.js';
import { paymentSettings, PaymentSettingsOptions } from '../payment-settings.js';
import { ModuleInput } from '@unchainedshop/mongodb';

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
