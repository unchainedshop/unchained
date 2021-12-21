import { Collection } from '@unchainedshop/types/common';
import { BityCredentials, PaymentModule } from '@unchainedshop/types/payments';

export const configureBityCredentialsModule = (
  BityCredentials: Collection<BityCredentials>
): PaymentModule['bityCredentials'] => {
  return {
    findBityCredentials: async ({ externalId }) => {
      return await BityCredentials.findOne({ externalId });
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
            externalId: doc.externalId,
            created: new Date(),
            createdBy: userId,
          },
        }
      );

      return doc.externalId;
    },
  };
};
