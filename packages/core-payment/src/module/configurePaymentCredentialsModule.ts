import { PaymentCredentials, PaymentModule } from '@unchainedshop/types/payments';
import { Collection } from '@unchainedshop/types/common';
import { generateDbFilterById, generateDbObjectId } from 'meteor/unchained:utils';

export const configurePaymentCredentialsModule = (
  PaymentCredentials: Collection<PaymentCredentials>,
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
      const credentialsCount = await PaymentCredentials.find(
        generateDbFilterById(paymentCredentialsId),
      ).count();
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
      const credentials = PaymentCredentials.find(query, options);
      return credentials.toArray();
    },

    upsertCredentials: async ({ userId, paymentProviderId, _id, token, ...meta }) => {
      const paymentCredentialsId = generateDbObjectId();
      const result = await PaymentCredentials.updateOne(
        _id
          ? generateDbFilterById(_id, {
              userId,
              paymentProviderId,
            })
          : {
              userId,
              paymentProviderId,
            },
        {
          $setOnInsert: {
            _id: paymentCredentialsId,
            userId,
            paymentProviderId,
            isPreferred: false,
            created: new Date(),
            createdBy: userId,
          },
          $set: {
            updated: new Date(),
            updatedBy: userId,
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
          paymentCredentialsId,
        });
        return paymentCredentialsId;
      }
      return null;
    },

    removeCredentials: async (paymentCredentialsId) => {
      const selector = generateDbFilterById(paymentCredentialsId);
      const paymentCredentials = await PaymentCredentials.findOne(selector);
      await PaymentCredentials.deleteOne(selector);
      return paymentCredentials;
    },
  };
};
