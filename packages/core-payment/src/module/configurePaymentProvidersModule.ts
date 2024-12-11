import { emit, registerEvents } from '@unchainedshop/events';
import { generateDbFilterById, generateDbObjectId, mongodb } from '@unchainedshop/mongodb';
import { PaymentProvider } from '../db/PaymentProvidersCollection.js';

export interface PaymentInterface {
  _id: string;
  label: string;
  version: string;
}

const PAYMENT_PROVIDER_EVENTS: string[] = [
  'PAYMENT_PROVIDER_CREATE',
  'PAYMENT_PROVIDER_UPDATE',
  'PAYMENT_PROVIDER_REMOVE',
];

const buildFindSelector = ({ type }: mongodb.Filter<PaymentProvider> = {}) => {
  return { ...(type ? { type } : {}), deleted: null };
};

export const configurePaymentProvidersModule = (
  PaymentProviders: mongodb.Collection<PaymentProvider>,
) => {
  registerEvents(PAYMENT_PROVIDER_EVENTS);

  return {
    // Queries
    count: async (query: mongodb.Filter<PaymentProvider>): Promise<number> => {
      const providerCount = await PaymentProviders.countDocuments(buildFindSelector(query));
      return providerCount;
    },

    findProvider: async (
      {
        paymentProviderId,
        ...query
      }: mongodb.Filter<PaymentProvider> & {
        paymentProviderId: string;
      },
      options?: mongodb.FindOptions,
    ): Promise<PaymentProvider> => {
      return PaymentProviders.findOne(
        paymentProviderId ? generateDbFilterById(paymentProviderId) : query,
        options,
      );
    },

    findProviders: async (
      query: mongodb.Filter<PaymentProvider>,
      options: mongodb.FindOptions = { sort: { created: 1 } },
    ): Promise<Array<PaymentProvider>> => {
      const providers = PaymentProviders.find(buildFindSelector(query), options);
      return providers.toArray();
    },

    providerExists: async ({ paymentProviderId }: { paymentProviderId: string }): Promise<boolean> => {
      const providerCount = await PaymentProviders.countDocuments(
        generateDbFilterById(paymentProviderId, { deleted: null }),
        { limit: 1 },
      );
      return !!providerCount;
    },

    // Mutations
    create: async (doc: PaymentProvider): Promise<PaymentProvider> => {
      const { insertedId: paymentProviderId } = await PaymentProviders.insertOne({
        _id: generateDbObjectId(),
        created: new Date(),
        ...doc,
      });

      const paymentProvider = await PaymentProviders.findOne(
        generateDbFilterById(paymentProviderId),
        {},
      );
      await emit('PAYMENT_PROVIDER_CREATE', { paymentProvider });
      return paymentProvider;
    },

    update: async (_id: string, doc: PaymentProvider): Promise<PaymentProvider> => {
      const paymentProvider = await PaymentProviders.findOneAndUpdate(
        generateDbFilterById(_id),
        {
          $set: {
            updated: new Date(),
            ...doc,
          },
        },
        { returnDocument: 'after' },
      );
      await emit('PAYMENT_PROVIDER_UPDATE', { paymentProvider });
      return paymentProvider;
    },

    delete: async (_id: string): Promise<PaymentProvider> => {
      const paymentProvider = await PaymentProviders.findOneAndUpdate(
        generateDbFilterById(_id),
        {
          $set: {
            deleted: new Date(),
          },
        },
        { returnDocument: 'after' },
      );
      await emit('PAYMENT_PROVIDER_REMOVE', { paymentProvider });
      return paymentProvider;
    },
  };
};

export type PaymentProvidersModule = ReturnType<typeof configurePaymentProvidersModule>;
