import { mongodb, buildDbIndexes } from '@unchainedshop/mongodb';
import { PaymentCredentials as PaymentCredentialsType } from '@unchainedshop/core-payment';

export const PaymentCredentialsCollection = async (db: mongodb.Db) => {
  const PaymentCredentials = db.collection<PaymentCredentialsType>('payment_credentials');

  await buildDbIndexes<PaymentCredentialsType>(PaymentCredentials, [
    { index: { paymentProviderId: 1 } },
    { index: { userId: 1 } },
  ]);

  return PaymentCredentials;
};
