import { Db, TimestampFields, _ID } from '@unchainedshop/types/common';

export type CryptopayTransaction = {
  _id?: _ID;
  blocks: number[];
  amount: number;
  currency: string;
  decimals: number;
  contract: string;
} & TimestampFields;

export const CryptopayTransactionsCollection = (db: Db) => {
  return db.collection<CryptopayTransaction>('cryptopay_transactions');
};
