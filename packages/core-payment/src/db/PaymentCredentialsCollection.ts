import { Db } from '@unchainedshop/types/common';
import { PaymentCredentials } from '@unchainedshop/types/payments';
import { buildDbIndexes } from 'meteor/unchained:utils'

export const PaymentCredentialsCollection = async (db: Db) => {
  const PaymentCredentials = db.collection<PaymentCredentials>('payment_credentials');

  await buildDbIndexes<PaymentCredentials>(PaymentCredentials, [
    () => PaymentCredentials.createIndex({ paymentProviderId: 1 }),
    () => PaymentCredentials.createIndex({ userId: 1 }),
  ]);

  return PaymentCredentials;
};
