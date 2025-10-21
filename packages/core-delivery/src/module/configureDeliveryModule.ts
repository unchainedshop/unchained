import { emit, registerEvents } from '@unchainedshop/events';
import { mongodb, generateDbFilterById, generateDbObjectId, ModuleInput } from '@unchainedshop/mongodb';
import { DeliveryProvidersCollection, DeliveryProvider } from '../db/DeliveryProvidersCollection.js';
import { deliverySettings, DeliverySettingsOptions } from '../delivery-settings.js';
import pMemoize from 'p-memoize';
import ExpiryMap from 'expiry-map';

const DELIVERY_PROVIDER_EVENTS: string[] = [
  'DELIVERY_PROVIDER_CREATE',
  'DELIVERY_PROVIDER_UPDATE',
  'DELIVERY_PROVIDER_REMOVE',
];

export interface DeliveryInterface {
  _id: string;
  label: string;
  version: string;
}

export const buildFindSelector = (query: mongodb.Filter<DeliveryProvider> = {}) => {
  return { deleted: null, ...query };
};

const allProvidersCache = new ExpiryMap(process.env.NODE_ENV === 'production' ? 60000 : 1);

export const configureDeliveryModule = async ({
  db,
  options: deliveryOptions = {},
}: ModuleInput<DeliverySettingsOptions>) => {
  registerEvents(DELIVERY_PROVIDER_EVENTS);

  deliverySettings.configureSettings(deliveryOptions);

  const DeliveryProviders = await DeliveryProvidersCollection(db);

  return {
    // Queries
    count: async (query: mongodb.Filter<DeliveryProvider>): Promise<number> => {
      const providerCount = await DeliveryProviders.countDocuments(buildFindSelector(query));
      return providerCount;
    },

    findProvider: async (
      {
        deliveryProviderId,
        ...query
      }: {
        deliveryProviderId: string;
      } & mongodb.Filter<DeliveryProvider>,
      options?: mongodb.FindOptions<DeliveryProvider>,
    ) => {
      return DeliveryProviders.findOne(
        deliveryProviderId ? generateDbFilterById(deliveryProviderId) : query,
        options,
      );
    },

    findProviders: async (
      query: mongodb.Filter<DeliveryProvider>,
      options: mongodb.FindOptions<DeliveryProvider> = { sort: { created: 1 } },
    ): Promise<DeliveryProvider[]> => {
      const providers = DeliveryProviders.find(buildFindSelector(query), options);
      return providers.toArray();
    },

    allProviders: pMemoize(
      async function () {
        return DeliveryProviders.find({ deleted: null }, { sort: { created: 1 } }).toArray();
      },
      {
        cache: allProvidersCache,
      },
    ),

    providerExists: async ({ deliveryProviderId }: { deliveryProviderId: string }): Promise<boolean> => {
      const providerCount = await DeliveryProviders.countDocuments(
        generateDbFilterById(deliveryProviderId, { deleted: null }),
        { limit: 1 },
      );
      return !!providerCount;
    },

    // Mutations
    create: async (
      doc: Omit<DeliveryProvider, '_id' | 'created'> & Pick<Partial<DeliveryProvider>, '_id'>,
    ) => {
      const { insertedId: deliveryProviderId } = await DeliveryProviders.insertOne({
        _id: generateDbObjectId(),
        created: new Date(),
        ...doc,
      });
      const deliveryProvider = (await DeliveryProviders.findOne(
        { _id: deliveryProviderId },
        {},
      )) as DeliveryProvider;
      allProvidersCache.clear();
      await emit('DELIVERY_PROVIDER_CREATE', { deliveryProvider });
      return deliveryProvider;
    },

    update: async (_id: string, doc: DeliveryProvider) => {
      const deliveryProvider = await DeliveryProviders.findOneAndUpdate(
        generateDbFilterById(_id),
        {
          $set: {
            updated: new Date(),
            ...doc,
          },
        },
        { returnDocument: 'after' },
      );
      if (!deliveryProvider) return null;
      allProvidersCache.clear();
      await emit('DELIVERY_PROVIDER_UPDATE', { deliveryProvider });
      return deliveryProvider;
    },

    delete: async (_id: string) => {
      const deliveryProvider = await DeliveryProviders.findOneAndUpdate(
        generateDbFilterById(_id),
        {
          $set: {
            deleted: new Date(),
          },
        },
        { returnDocument: 'after' },
      );
      if (!deliveryProvider) return null;
      allProvidersCache.clear();
      await emit('DELIVERY_PROVIDER_REMOVE', { deliveryProvider });
      return deliveryProvider;
    },
  };
};

export type DeliveryModule = Awaited<ReturnType<typeof configureDeliveryModule>>;
