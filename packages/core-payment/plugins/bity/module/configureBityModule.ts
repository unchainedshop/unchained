import { Db } from '@unchainedshop/types/common';
import { generateDbObjectId } from '@unchainedshop/utils';
import { BityCredentialsCollection, BityCredentialsType } from '../db/BityCredentialsCollection';

export interface BityModule {
  findBityCredentials: (query: { externalId: string }) => Promise<BityCredentialsType>;

  upsertCredentials: (doc: BityCredentialsType, userId: string) => Promise<string | null>;
}

export const configureBityModule = ({ db }: { db: Db }): BityModule => {
  const BityCredentials = BityCredentialsCollection(db);

  return {
    findBityCredentials: async ({ externalId }) => {
      return BityCredentials.findOne({ externalId });
    },

    upsertCredentials: async (doc, userId) => {
      await BityCredentials.updateOne(
        {
          externalId: doc.externalId,
        },
        {
          $set: {
            data: {
              iv: doc.data.iv,
              encryptedData: doc.data.encryptedData,
            },
            expires: doc.expires,
            updated: new Date(),
            updatedBy: userId,
          },
          $setOnInsert: {
            _id: generateDbObjectId(),
            externalId: doc.externalId,
            created: new Date(),
            createdBy: userId,
          },
        },
      );

      return doc.externalId;
    },
  };
};
