import { Db, TimestampFields, _ID } from '@unchainedshop/types/common';

export type CryptopayRecordsType = {
  _id?: _ID;
  address: string;
  contract: string;
  amount: string;
} & TimestampFields;

export const CryptopayRecordsCollection = (db: Db) => {
  const CryptopayRecords = db.collection<CryptopayRecordsType>('cryptopay_records');

  return CryptopayRecords;
};
