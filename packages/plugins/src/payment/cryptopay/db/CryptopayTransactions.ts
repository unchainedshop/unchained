import { Db, TimestampFields, _ID } from '@unchainedshop/types/common';
import { Decimal128 } from 'mongodb';

export type CryptopayTransaction = {
  _id?: _ID;
  blockHeight: number;
  mostRecentBlockHeight: number;
  amount: Decimal128;
  currency: string;
  decimals: number;
  contract: string;
  orderPaymentId?: string;
} & TimestampFields;

export const CryptopayTransactionsCollection = (db: Db) => {
  return db.collection<CryptopayTransaction>('cryptopay_transactions');
};
