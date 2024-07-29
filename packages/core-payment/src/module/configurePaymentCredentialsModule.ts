import { mongodb, generateDbFilterById, generateDbObjectId } from '@unchainedshop/mongodb';
import { PaymentCredentials as PaymentCredentialsType } from '../types.js';

export type PaymentCredentialsModules = {
  // Queries

  credentialsExists: (query: { paymentCredentialsId: string }) => Promise<boolean>;

  findPaymentCredential: (
    query: {
      paymentCredentialsId?: string;
      userId?: string;
      paymentProviderId?: string;
      isPreferred?: boolean;
    },
    options?: mongodb.FindOptions,
  ) => Promise<PaymentCredentialsType>;

  findPaymentCredentials: (
    query: mongodb.Filter<PaymentCredentialsType>,
    options?: mongodb.FindOptions,
  ) => Promise<Array<PaymentCredentialsType>>;

  // Mutations
  markPreferred: (query: { userId: string; paymentCredentialsId: string }) => Promise<void>;

  upsertCredentials: (
    doc: Pick<PaymentCredentialsType, 'userId' | 'paymentProviderId' | '_id' | 'token'> & {
      [x: string]: any;
    },
  ) => Promise<string | null>;

  removeCredentials: (paymentCredentialsId: string) => Promise<PaymentCredentialsType>;
};

export const configurePaymentCredentialsModule = (
  PaymentCredentials: mongodb.Collection<PaymentCredentialsType>,
): PaymentCredentialsModules => {
  const markPreferred = async ({ userId, paymentCredentialsId }) => {
    await PaymentCredentials.updateOne(
      {
        _id: paymentCredentialsId,
      },
      {
        $set: {
          isPreferred: true,
        },
      },
    );
    await PaymentCredentials.updateMany(
      {
        _id: { $ne: paymentCredentialsId },
        userId,
      },
      {
        $set: {
          isPreferred: false,
        },
      },
    );
  };

  return {
    markPreferred,

    credentialsExists: async ({ paymentCredentialsId }) => {
      const credentialsCount = await PaymentCredentials.countDocuments(
        generateDbFilterById(paymentCredentialsId),
        { limit: 1 },
      );
      return !!credentialsCount;
    },

    findPaymentCredential: async ({ paymentCredentialsId, userId, paymentProviderId }, options) => {
      return PaymentCredentials.findOne(
        paymentCredentialsId
          ? generateDbFilterById(paymentCredentialsId)
          : { userId, paymentProviderId },
        options,
      );
    },

    findPaymentCredentials: async (query, options) => {
      const credentials = await PaymentCredentials.find(query, options).toArray();
      return credentials;
    },

    upsertCredentials: async ({ userId, paymentProviderId, _id, token, ...meta }) => {
      const insertedId = _id || generateDbObjectId();
      const result = await PaymentCredentials.updateOne(
        _id
          ? generateDbFilterById(_id)
          : {
              userId,
              paymentProviderId,
            },
        {
          $setOnInsert: {
            _id: insertedId,
            userId,
            paymentProviderId,
            isPreferred: false,
            created: new Date(),
          },
          $set: {
            updated: new Date(),
            token,
            meta,
          },
        },
        {
          upsert: true,
        },
      );

      if (result.upsertedCount > 0) {
        await markPreferred({
          userId,
          paymentCredentialsId: insertedId,
        });
        return insertedId;
      }
      return null;
    },

    removeCredentials: async (paymentCredentialsId) => {
      const selector = generateDbFilterById(paymentCredentialsId);
      const paymentCredentials = await PaymentCredentials.findOneAndDelete(selector, {});
      return paymentCredentials;
    },
  };
};
