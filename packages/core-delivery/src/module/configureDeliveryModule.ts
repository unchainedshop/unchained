import { emit, registerEvents } from '@unchainedshop/events';
import { mongodb, generateDbFilterById, generateDbObjectId, ModuleInput } from '@unchainedshop/mongodb';
import { DeliveryProvidersCollection, DeliveryProvider } from '../db/DeliveryProvidersCollection.js';
import { deliverySettings, DeliverySettingsOptions } from '../delivery-settings.js';

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

export const buildFindSelector = ({ type }: mongodb.Filter<DeliveryProvider> = {}) => {
  return { ...(type ? { type } : {}), deleted: null };
};

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
    ): Promise<DeliveryProvider> => {
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

    providerExists: async ({ deliveryProviderId }: { deliveryProviderId: string }): Promise<boolean> => {
      const providerCount = await DeliveryProviders.countDocuments(
        generateDbFilterById(deliveryProviderId, { deleted: null }),
        { limit: 1 },
      );
      return !!providerCount;
    },

    // Mutations
    create: async (doc: DeliveryProvider): Promise<DeliveryProvider> => {
      const { insertedId: deliveryProviderId } = await DeliveryProviders.insertOne({
        _id: generateDbObjectId(),
        created: new Date(),
        ...doc,
      });
      const deliveryProvider = await DeliveryProviders.findOne({ _id: deliveryProviderId }, {});
      await emit('DELIVERY_PROVIDER_CREATE', { deliveryProvider });
      return deliveryProvider;
    },

    update: async (_id: string, doc: DeliveryProvider): Promise<DeliveryProvider> => {
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
      await emit('DELIVERY_PROVIDER_UPDATE', { deliveryProvider });
      return deliveryProvider;
    },

    delete: async (_id: string): Promise<DeliveryProvider> => {
      const deliveryProvider = await DeliveryProviders.findOneAndUpdate(
        generateDbFilterById(_id),
        {
          $set: {
            deleted: new Date(),
          },
        },
        { returnDocument: 'after' },
      );
      await emit('DELIVERY_PROVIDER_REMOVE', { deliveryProvider });
      return deliveryProvider;
    },
  };
};

export type DeliveryModule = Awaited<ReturnType<typeof configureDeliveryModule>>;
