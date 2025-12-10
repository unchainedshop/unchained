import { emit, registerEvents } from '@unchainedshop/events';
import { generateDbFilterById, generateDbObjectId, mongodb } from '@unchainedshop/mongodb';
import type { PaymentProvider } from '../db/PaymentProvidersCollection.ts';
import pMemoize from 'p-memoize';
import ExpiryMap from 'expiry-map';

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

const allProvidersCache = new ExpiryMap(process.env.NODE_ENV === 'production' ? 60000 : 1);

export const buildFindSelector = ({
  includeDeleted = false,
  ...rest
}: mongodb.Filter<PaymentProvider> & { includeDeleted?: boolean } = {}) => {
  return { ...(includeDeleted ? {} : { deleted: null }), ...rest };
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
    ) => {
      return PaymentProviders.findOne(
        paymentProviderId ? generateDbFilterById(paymentProviderId) : query,
        options,
      );
    },

    findProviders: async (
      query: mongodb.Filter<PaymentProvider> & { includeDeleted?: boolean },
      options: mongodb.FindOptions = { sort: { created: 1 } },
    ): Promise<PaymentProvider[]> => {
      const providers = PaymentProviders.find(buildFindSelector(query), options);
      return providers.toArray();
    },

    allProviders: pMemoize(
      async function () {
        return PaymentProviders.find({ deleted: null }, { sort: { created: 1 } }).toArray();
      },
      {
        cache: allProvidersCache,
      },
    ),

    providerExists: async ({ paymentProviderId }: { paymentProviderId: string }): Promise<boolean> => {
      const providerCount = await PaymentProviders.countDocuments(
        generateDbFilterById(paymentProviderId, { deleted: null }),
        { limit: 1 },
      );
      return !!providerCount;
    },

    // Mutations
    create: async (
      doc: Omit<PaymentProvider, '_id' | 'created'> & Pick<Partial<PaymentProvider>, '_id' | 'created'>,
    ): Promise<PaymentProvider> => {
      const { insertedId: paymentProviderId } = await PaymentProviders.insertOne({
        _id: generateDbObjectId(),
        created: new Date(),
        ...doc,
      });

      const paymentProvider = (await PaymentProviders.findOne(
        generateDbFilterById(paymentProviderId),
        {},
      )) as PaymentProvider;
      allProvidersCache.clear();
      await emit('PAYMENT_PROVIDER_CREATE', { paymentProvider });
      return paymentProvider;
    },

    update: async (_id: string, doc: PaymentProvider) => {
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
      if (!paymentProvider) return null;
      allProvidersCache.clear();
      await emit('PAYMENT_PROVIDER_UPDATE', { paymentProvider });
      return paymentProvider;
    },

    delete: async (_id: string) => {
      const paymentProvider = await PaymentProviders.findOneAndUpdate(
        generateDbFilterById(_id),
        {
          $set: {
            deleted: new Date(),
          },
        },
        { returnDocument: 'after' },
      );
      if (!paymentProvider) return null;
      allProvidersCache.clear();
      await emit('PAYMENT_PROVIDER_REMOVE', { paymentProvider });
      return paymentProvider;
    },
  };
};

export type PaymentProvidersModule = ReturnType<typeof configurePaymentProvidersModule>;
