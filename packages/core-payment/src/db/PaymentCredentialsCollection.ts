import { Db } from '@unchainedshop/types/common.js';
import { PaymentCredentials as PaymentCredentialsType } from '@unchainedshop/types/payments.js';
import { buildDbIndexes } from '@unchainedshop/utils';

export const PaymentCredentialsCollection = async (db: Db) => {
  const PaymentCredentials = db.collection<PaymentCredentialsType>('payment_credentials');

  await buildDbIndexes<PaymentCredentialsType>(PaymentCredentials, [
    { index: { paymentProviderId: 1 } },
    { index: { userId: 1 } },
  ]);

  return PaymentCredentials;
};
