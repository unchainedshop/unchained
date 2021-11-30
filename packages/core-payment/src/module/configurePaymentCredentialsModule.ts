import {
  PaymentCredentials,
  PaymentModule
} from '@unchainedshop/types/payments';
import { Collection } from 'meteor/unchained:utils';

export const configurePaymentCredentialsModule = (
  PaymentCredentials: Collection<PaymentCredentials>
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
      }
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
      }
    );
  };

  return {
    markPreferred,

    credentialsExists: async ({ paymentCredentialsId }) => {
      const credentialsCount = await PaymentCredentials.find({
        _id: paymentCredentialsId,
      }).count();
      return !!credentialsCount;
    },

    findCredentials: async (
      { paymentCredentialsId, userId, paymentProviderId },
      options
    ) => {
      return await PaymentCredentials.findOne(
        paymentCredentialsId
          ? { _id: paymentCredentialsId }
          : { userId, paymentProviderId },
        options
      );
    },

    upsertCredentials: async ({
      userId,
      paymentProviderId,
      _id,
      token,
      ...meta
    }) => {
      const result = await PaymentCredentials.updateOne(
        {
          userId,
          paymentProviderId,
          _id: _id || { $exists: true },
        },
        {
          $setOnInsert: {
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
        }
      );

      if (!!result.upsertedCount) {
        await markPreferred({
          userId,
          paymentCredentialsId: result.upsertedId.toHexString(),
        });
        return result.upsertedId.toHexString();
      }
      return null;
    },
    removeCredentials: async (paymentCredentialsId) => {
      const paymentCredentials = PaymentCredentials.findOne({
        _id: paymentCredentialsId,
      });
      PaymentCredentials.deleteOne({
        _id: paymentCredentialsId,
      });
      return paymentCredentials;
    },
  };
};
