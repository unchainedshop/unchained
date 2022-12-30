import { ModuleInput } from '@unchainedshop/types/core.js';
import { PaymentModule, PaymentSettingsOptions } from '@unchainedshop/types/payments';
import { PaymentCredentialsCollection } from '../db/PaymentCredentialsCollection.js';
import { PaymentProvidersCollection } from '../db/PaymentProvidersCollection.js';
import { configurePaymentCredentialsModule } from './configurePaymentCredentialsModule.js';
import { configurePaymentProvidersModule } from './configurePaymentProvidersModule.js';
import { paymentSettings } from '../payment-settings.js';

export const configurePaymentModule = async ({
  db,
  options: paymentOptions = {},
}: ModuleInput<PaymentSettingsOptions>): Promise<PaymentModule> => {
  const PaymentProviders = await PaymentProvidersCollection(db);
  const PaymentCredentials = await PaymentCredentialsCollection(db);

  paymentSettings.configureSettings(paymentOptions);

  const paymentProviders = configurePaymentProvidersModule(PaymentProviders);
  const paymentCredentials = configurePaymentCredentialsModule(PaymentCredentials);

  const registerCredentials: PaymentModule['registerCredentials'] = async (
    paymentProviderId,
    paymentContext,
    unchainedAPI,
  ) => {
    const registration = await paymentProviders.register(
      paymentProviderId,
      paymentContext,
      unchainedAPI,
    );

    if (!registration) return null;

    const paymentCredentialsId = await paymentCredentials.upsertCredentials({
      userId: paymentContext.userId,
      paymentProviderId,
      ...registration,
    });

    return paymentCredentials.findPaymentCredential({
      paymentCredentialsId,
      userId: paymentContext.userId,
      paymentProviderId,
    });
  };

  return {
    paymentProviders,
    paymentCredentials,
    registerCredentials,
  };
};
