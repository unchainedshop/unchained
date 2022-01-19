import { ModuleInput } from '@unchainedshop/types/common';
import { PaymentModule, PaymentProvidersSettingsOptions } from '@unchainedshop/types/payments';
import { BityCredentialsCollection } from '../db/BityCredentialsCollection';
import { PaymentCredentialsCollection } from '../db/PaymentCredentialsCollection';
import { PaymentProvidersCollection } from '../db/PaymentProvidersCollection';
import { configureBityCredentialsModule } from './configureBityCredentialsModule';
import { configurePaymentCredentialsModule } from './configurePaymentCredentialsModule';
import { configurePaymentProvidersModule } from './configurePaymentProvidersModule';

export const configurePaymentModule = async ({
  db,
  options,
}: ModuleInput<PaymentProvidersSettingsOptions>): Promise<PaymentModule> => {
  const PaymentProviders = await PaymentProvidersCollection(db, options);
  const PaymentCredentials = await PaymentCredentialsCollection(db);
  const BityCredentials = BityCredentialsCollection(db);

  return {
    paymentProviders: configurePaymentProvidersModule(PaymentProviders),
    paymentCredentials: configurePaymentCredentialsModule(PaymentCredentials),
    bityCredentials: configureBityCredentialsModule(BityCredentials),
  };
};
