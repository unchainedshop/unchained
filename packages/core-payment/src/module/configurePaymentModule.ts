import { ModuleInput } from '@unchainedshop/types/common';
import {
  PaymentModule,
  PaymentProvidersSettingsOptions,
} from '@unchainedshop/types/payments';
import { AppleTransactionsCollection } from '../db/AppleTransactionsCollection';
import { BityCredentialsCollection } from '../db/BityCredentialsCollection';
import { PaymentCredentialsCollection } from '../db/PaymentCredentialsCollection';
import { PaymentProvidersCollection } from '../db/PaymentProvidersCollection';
import { configureAppleTransactionsModule } from './configureAppleTransactionsModule';
import { configureBityCredentialsModule } from './configureBityCredentialsModule';
import { configurePaymentCredentialsModule } from './configurePaymentCredentialsModule';
import { configurePaymentProvidersModule } from './configurePaymentProvidersModule';

export const configurePaymentModule = async ({
  db,
  options,
}: ModuleInput<PaymentProvidersSettingsOptions>): Promise<PaymentModule> => {
  const PaymentProviders = await PaymentProvidersCollection(db);
  const PaymentCredentials = await PaymentCredentialsCollection(db);
  const BityCredentials = BityCredentialsCollection(db);
  const AppleTransactions = await AppleTransactionsCollection(db);

  return {
    paymentProviders: configurePaymentProvidersModule(
      PaymentProviders,
      options
    ),
    paymentCredentials: configurePaymentCredentialsModule(PaymentCredentials),
    bityCredentials: configureBityCredentialsModule(BityCredentials),
    appleTransactions: configureAppleTransactionsModule(AppleTransactions),
  };
};
