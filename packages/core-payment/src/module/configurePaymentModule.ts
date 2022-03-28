import { ModuleInput } from '@unchainedshop/types/common';
import { PaymentModule, PaymentSettingsOptions } from '@unchainedshop/types/payments';
import { PaymentCredentialsCollection } from '../db/PaymentCredentialsCollection';
import { PaymentProvidersCollection } from '../db/PaymentProvidersCollection';
import { configurePaymentCredentialsModule } from './configurePaymentCredentialsModule';
import { configurePaymentProvidersModule } from './configurePaymentProvidersModule';
import { paymentSettings } from '../payment-settings';

export const configurePaymentModule = async ({
  db,
  options: paymentOptions = {},
}: ModuleInput<PaymentSettingsOptions>): Promise<PaymentModule> => {
  const PaymentProviders = await PaymentProvidersCollection(db);
  const PaymentCredentials = await PaymentCredentialsCollection(db);

  paymentSettings.configureSettings(paymentOptions);

  return {
    paymentProviders: configurePaymentProvidersModule(PaymentProviders),
    paymentCredentials: configurePaymentCredentialsModule(PaymentCredentials),
  };
};
