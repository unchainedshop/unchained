import { configurePaymentCredentialsModule } from './configurePaymentCredentialsModule.ts';
import { configurePaymentProvidersModule } from './configurePaymentProvidersModule.ts';
import { paymentSettings, type PaymentSettingsOptions } from '../payment-settings.ts';
import type { DrizzleDb } from '@unchainedshop/store';

export const configurePaymentModule = async ({
  db,
  options: paymentOptions = {},
}: {
  db: DrizzleDb;
  options?: PaymentSettingsOptions;
}) => {
  paymentSettings.configureSettings(paymentOptions);

  const paymentProviders = configurePaymentProvidersModule(db);
  const paymentCredentials = configurePaymentCredentialsModule(db);

  return {
    paymentProviders,
    paymentCredentials,
  };
};

export type PaymentModule = Awaited<ReturnType<typeof configurePaymentModule>>;
