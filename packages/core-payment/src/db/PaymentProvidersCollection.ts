import { Db } from '@unchainedshop/types/common';
import { PaymentProvider } from '@unchainedshop/types/payments';
import { buildDbIndexes } from 'meteor/unchained:utils'

export const PaymentProvidersCollection = async (db: Db) => {
  const PaymentProviders = db.collection<PaymentProvider>('payment-providers');

  await buildDbIndexes<PaymentProvider>(PaymentProviders, [
    () => PaymentProviders.createIndex({ type: 1 }),
  ]);

  return PaymentProviders;
};
