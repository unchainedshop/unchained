import { Db } from '@unchainedshop/types/common.js';
import { PaymentProvider } from '@unchainedshop/types/payments.js';
import { buildDbIndexes } from '@unchainedshop/mongodb';

export const PaymentProvidersCollection = async (db: Db) => {
  const PaymentProviders = db.collection<PaymentProvider>('payment-providers');

  await buildDbIndexes<PaymentProvider>(PaymentProviders, [{ index: { type: 1 } }]);

  return PaymentProviders;
};
