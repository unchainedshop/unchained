import { PaymentCredentialsCollection } from '../db/PaymentCredentialsCollection.ts';
import { configurePaymentCredentialsModule } from './configurePaymentCredentialsModule.ts';
import { configurePaymentProvidersModule } from './configurePaymentProvidersModule.ts';
import { paymentSettings, type PaymentSettingsOptions } from '../payment-settings.ts';
import type { mongodb } from '@unchainedshop/mongodb';
import type { IStore } from '@unchainedshop/store';

export interface PaymentModuleInput {
  db: mongodb.Db; // For credentials (MongoDB)
  store: IStore; // For providers (Store)
  options?: PaymentSettingsOptions;
}

export const configurePaymentModule = async ({
  db,
  store,
  options: paymentOptions = {},
}: PaymentModuleInput) => {
  const PaymentCredentials = await PaymentCredentialsCollection(db);

  paymentSettings.configureSettings(paymentOptions);

  const paymentProviders = configurePaymentProvidersModule(store);
  const paymentCredentials = configurePaymentCredentialsModule(PaymentCredentials);

  return {
    paymentProviders,
    paymentCredentials,
  };
};

export type PaymentModule = Awaited<ReturnType<typeof configurePaymentModule>>;
