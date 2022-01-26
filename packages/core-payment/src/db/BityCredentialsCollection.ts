import { Db } from '@unchainedshop/types/common';
import { BityCredentials } from '@unchainedshop/types/payments';

export const BityCredentialsCollection = (db: Db) => {
  const BityCredentials = db.collection<BityCredentials>('bity_credentials');

  return BityCredentials;
};
