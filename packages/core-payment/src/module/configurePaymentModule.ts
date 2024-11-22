import { UnchainedCore } from '@unchainedshop/core';
import {
  PaymentCredentialsCollection,
  PaymentCredentials as PaymentCredentialsType,
} from '../db/PaymentCredentialsCollection.js';
import { PaymentProvidersCollection } from '../db/PaymentProvidersCollection.js';
import {
  configurePaymentCredentialsModule,
  PaymentCredentialsModules,
} from './configurePaymentCredentialsModule.js';
import {
  configurePaymentProvidersModule,
  PaymentProvidersModules,
} from './configurePaymentProvidersModule.js';
import { paymentSettings, PaymentSettingsOptions } from '../payment-settings.js';
import { PaymentContext } from '../types.js';
import { ModuleInput } from '@unchainedshop/mongodb';
export type PaymentModule = {
  /*
   * Payment Providers Module
   */

  registerCredentials: (
    paymentProviderId: string,
    paymentContext: PaymentContext,
    unchainedAPI: UnchainedCore,
  ) => Promise<PaymentCredentialsType>;

  paymentProviders: PaymentProvidersModules;

  /*
   * Payment Credentials Module
   */

  paymentCredentials: PaymentCredentialsModules;
};

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
