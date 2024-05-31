import {
  PaymentCredentials as PaymentCredentialsType,
  PaymentModule,
} from '@unchainedshop/types/payments.js';
import { mongodb, generateDbFilterById, generateDbObjectId } from '@unchainedshop/mongodb';

export const configurePaymentCredentialsModule = (
  PaymentCredentials: mongodb.Collection<PaymentCredentialsType>,
): PaymentModule['paymentCredentials'] => {
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
