import { mongodb, buildDbIndexes } from '@unchainedshop/mongodb';
import { PaymentProvider } from '@unchainedshop/types/payments.js';

export const PaymentProvidersCollection = async (db: mongodb.Db) => {
  const PaymentProviders = db.collection<PaymentProvider>('payment-providers');

  await buildDbIndexes<PaymentProvider>(PaymentProviders, [
    { index: { type: 1 } },
    {
      index: {
        deleted: 1,
      },
    },
  ]);

  return PaymentProviders;
};
