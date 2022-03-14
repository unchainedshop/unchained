import { Db } from '@unchainedshop/types/common';
import { generateDbObjectId } from 'meteor/unchained:utils';
import { CryptopayRecordsCollection, CryptopayRecordsType } from '../db/CryptopayRecordsCollection';

export interface CryptopayModule {
  findCryptopayRecords: (query: { address: string }) => Promise<CryptopayRecordsType>;

  create: (doc: CryptopayRecordsType, userId: string) => Promise<string | null>;
}

export const configureCryptopayModule = ({ db }: { db: Db }): CryptopayModule => {
  const CryptopayRecords = CryptopayRecordsCollection(db);

  return {
    findCryptopayRecords: async ({ address }) => {
      return CryptopayRecords.findOne({ address });
    },

    create: async (doc, userId) => {
      const _id = generateDbObjectId();
      await CryptopayRecords.insertOne({
        _id,
        address: doc.address,
        contract: doc.contract,
        amount: doc.amount,
        created: new Date(),
        createdBy: userId,
      });

      return _id;
    },
  };
};
