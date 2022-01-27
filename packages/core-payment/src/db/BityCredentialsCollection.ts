import { Db } from '@unchainedshop/types/common';
import { BityCredentials as BityCredentialsType } from '@unchainedshop/types/payments';

export const BityCredentialsCollection = (db: Db) => {
  const BityCredentials = db.collection<BityCredentialsType>('bity_credentials');

  return BityCredentials;
};
