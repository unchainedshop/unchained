import { mongodb, generateDbFilterById, generateDbObjectId } from '@unchainedshop/mongodb';
import { PaymentCredentials as PaymentCredentialsType } from '../db/PaymentCredentialsCollection.js';

export const configurePaymentCredentialsModule = (
  PaymentCredentials: mongodb.Collection<PaymentCredentialsType>,
) => {
  const markPreferred = async ({
    userId,
    paymentCredentialsId,
  }: {
    userId: string;
    paymentCredentialsId: string;
  }) => {
    const paymentCredentials = await PaymentCredentials.findOneAndUpdate(
      {
        _id: paymentCredentialsId,
      },
      {
        $set: {
          isPreferred: true,
        },
      },
      { returnDocument: 'after' },
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
    return paymentCredentials;
  };

  return {
    markPreferred,
    async count(query: mongodb.Filter<PaymentCredentialsType>): Promise<number> {
      const credentials = await PaymentCredentials.countDocuments(query);
      return credentials;
    },
    credentialsExists: async ({
      paymentCredentialsId,
    }: {
      paymentCredentialsId: string;
    }): Promise<boolean> => {
      const credentialsCount = await PaymentCredentials.countDocuments(
        generateDbFilterById(paymentCredentialsId),
        { limit: 1 },
      );
      return !!credentialsCount;
    },

    findPaymentCredential: async (
      {
        paymentCredentialsId,
        userId,
        paymentProviderId,
      }: {
        paymentCredentialsId?: string;
        userId?: string;
        paymentProviderId?: string;
      },
      options?: mongodb.FindOptions,
    ) => {
      return PaymentCredentials.findOne(
        paymentCredentialsId
          ? generateDbFilterById(paymentCredentialsId)
          : { userId, paymentProviderId },
        options,
      );
    },

    findPaymentCredentials: async (
      query: mongodb.Filter<PaymentCredentialsType>,
      options?: mongodb.FindOptions,
    ): Promise<PaymentCredentialsType[]> => {
      const credentials = await PaymentCredentials.find(query, options).toArray();
      return credentials;
    },

    upsertCredentials: async ({
      userId,
      paymentProviderId,
      _id,
      token,
      ...meta
    }: Pick<PaymentCredentialsType, 'userId' | 'paymentProviderId' | '_id' | 'token'> &
      Record<string, any>) => {
      const insertedId = _id || generateDbObjectId();
      await PaymentCredentials.findOneAndUpdate(
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
          returnDocument: 'after',
        },
      );

      const paymentCredentials = await markPreferred({
        userId,
        paymentCredentialsId: insertedId,
      });

      return paymentCredentials as PaymentCredentialsType;
    },

    removeCredentials: async (paymentCredentialsId: string) => {
      const selector = generateDbFilterById(paymentCredentialsId);
      const paymentCredentials = await PaymentCredentials.findOneAndDelete(selector, {});
      return paymentCredentials;
    },
    deleteUserPaymentCredentials: async (userId: string): Promise<number> => {
      const { deletedCount } = await PaymentCredentials.deleteMany({ userId }, {});
      return deletedCount;
    },
  };
};

export type PaymentCredentialsModule = ReturnType<typeof configurePaymentCredentialsModule>;
