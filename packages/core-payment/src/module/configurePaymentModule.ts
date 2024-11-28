import {
  PaymentCredentialsCollection,
  PaymentCredentials as PaymentCredentialsType,
} from '../db/PaymentCredentialsCollection.js';
import { PaymentProvidersCollection } from '../db/PaymentProvidersCollection.js';
import { configurePaymentCredentialsModule } from './configurePaymentCredentialsModule.js';
import { configurePaymentProvidersModule } from './configurePaymentProvidersModule.js';
import { paymentSettings, PaymentSettingsOptions } from '../payment-settings.js';
import { ModuleInput } from '@unchainedshop/mongodb';
import { PaymentContext } from '../director/PaymentAdapter.js';
import { PaymentDirector } from '../director/PaymentDirector.js';

export const configurePaymentModule = async ({
  db,
  options: paymentOptions = {},
}: ModuleInput<PaymentSettingsOptions>) => {
  const PaymentProviders = await PaymentProvidersCollection(db);
  const PaymentCredentials = await PaymentCredentialsCollection(db);

  paymentSettings.configureSettings(paymentOptions);

  const paymentProviders = configurePaymentProvidersModule(PaymentProviders);
  const paymentCredentials = configurePaymentCredentialsModule(PaymentCredentials);

  const registerCredentials = async (
    paymentProviderId: string,
    paymentContext: PaymentContext,
    unchainedAPI,
  ): Promise<PaymentCredentialsType> => {
    const paymentProvider = await paymentProviders.findProvider({
      paymentProviderId,
    });
    const actions = await PaymentDirector.actions(paymentProvider, paymentContext, unchainedAPI);
    const registration = await actions.register();

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

export type PaymentModule = Awaited<ReturnType<typeof configurePaymentModule>>;
