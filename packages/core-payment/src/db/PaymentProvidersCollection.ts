import { mongodb, buildDbIndexes, TimestampFields } from '@unchainedshop/mongodb';

export enum PaymentProviderType {
  CARD = 'CARD',
  INVOICE = 'INVOICE',
  GENERIC = 'GENERIC',
}

export type PaymentConfiguration = Array<{
  key: string;
  value: string | null;
}>;

export type PaymentProvider = {
  _id?: string;
  type: PaymentProviderType;
  adapterKey: string;
  configuration: PaymentConfiguration;
} & TimestampFields;

export const PaymentProvidersCollection = async (db: mongodb.Db) => {
  const PaymentProviders = db.collection<PaymentProvider>('payment-providers');

  await buildDbIndexes<PaymentProvider>(PaymentProviders, [
    { index: { type: 1 } },
    {
      index: {
        created: 1,
      },
    },
    {
      index: {
        deleted: 1,
      },
    },
  ]);

  return PaymentProviders;
};
