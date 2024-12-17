import { mongodb, buildDbIndexes, TimestampFields } from '@unchainedshop/mongodb';

export type PaymentCredentials = {
  _id?: string;
  paymentProviderId: string;
  userId: string;
  token?: string;
  isPreferred?: boolean;
  meta: any;
} & TimestampFields;

export const PaymentCredentialsCollection = async (db: mongodb.Db) => {
  const PaymentCredentialsCol = db.collection<PaymentCredentials>('payment_credentials');

  await buildDbIndexes<PaymentCredentials>(PaymentCredentialsCol, [
    { index: { paymentProviderId: 1 } },
    { index: { userId: 1 } },
  ]);

  return PaymentCredentialsCol;
};
