import { Db, TimestampFields, _ID } from '@unchainedshop/types/common';

export type BityCredentialsType = {
  _id?: _ID;
  externalId: string;
  data: {
    iv: string;
    encryptedData: string;
  };
  expires: Date;
} & TimestampFields;

export const BityCredentialsCollection = (db: Db) => {
  const BityCredentials = db.collection<BityCredentialsType>('bity_credentials');

  return BityCredentials;
};
