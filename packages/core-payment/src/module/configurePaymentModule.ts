import { ModuleInput } from '@unchainedshop/types/common';
import { PaymentModule } from '@unchainedshop/types/payments';
import { PaymentCredentialsCollection } from '../db/PaymentCredentialsCollection';
import { PaymentProvidersCollection } from '../db/PaymentProvidersCollection';
import { configurePaymentCredentialsModule } from './configurePaymentCredentialsModule';
import { configurePaymentProvidersModule } from './configurePaymentProvidersModule';

export const configurePaymentModule = async ({
  db,
}: ModuleInput): Promise<PaymentModule> => {

  const PaymentProviders = await PaymentProvidersCollection(db);
  const PaymentCredentials = await PaymentCredentialsCollection(db);
  
  return {
    paymentProviders: configurePaymentProvidersModule(PaymentProviders),
    paymentCredentials: configurePaymentCredentialsModule(PaymentCredentials)
  }
};