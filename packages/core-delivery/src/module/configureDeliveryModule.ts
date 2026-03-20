import { emit, registerEvents } from '@unchainedshop/events';
import {
  mongodb,
  generateDbFilterById,
  generateDbObjectId,
  escapeRegexString,
  type ModuleInput,
} from '@unchainedshop/mongodb';
import {
  DeliveryProvidersCollection,
  type DeliveryProvider,
  type DeliveryProviderType,
} from '../db/DeliveryProvidersCollection.ts';
import { deliverySettings, type DeliverySettingsOptions } from '../delivery-settings.ts';
import { memoizeWithTTL } from '@unchainedshop/utils';

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

export interface DeliveryProviderQuery {
  deliveryProviderIds?: string[];
  type?: DeliveryProviderType;
  includeDeleted?: boolean;
  queryString?: string;
}

export const buildFindSelector = ({
  includeDeleted = false,
  queryString,
  deliveryProviderIds,
  type,
}: DeliveryProviderQuery = {}): mongodb.Filter<DeliveryProvider> => {
  const selector: mongodb.Filter<DeliveryProvider> = includeDeleted ? {} : { deleted: null };

  if (deliveryProviderIds) {
    selector._id = { $in: deliveryProviderIds };
  }

  if (type) {
    selector.type = type;
  }

  if (queryString) {
    const regex = new RegExp(escapeRegexString(queryString), 'i');
    selector.$or = [{ _id: regex }, { adapterKey: regex }] as any;
  }

  return selector;
};

const allProvidersTtlMs = process.env.NODE_ENV === 'production' ? 60000 : 1;

export const configureDeliveryModule = async ({
  db,
  options: deliveryOptions = {},
}: ModuleInput<DeliverySettingsOptions>) => {
  registerEvents(DELIVERY_PROVIDER_EVENTS);

  deliverySettings.configureSettings(deliveryOptions);

  const DeliveryProviders = await DeliveryProvidersCollection(db);

  const allProviders = memoizeWithTTL(async function () {
    return DeliveryProviders.find({ deleted: null }, { sort: { created: 1 } }).toArray();
  }, allProvidersTtlMs);

  return {
    // Queries
    count: async (query: DeliveryProviderQuery = {}): Promise<number> => {
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
      options?: mongodb.FindOptions,
    ) => {
      return DeliveryProviders.findOne(
        deliveryProviderId ? generateDbFilterById(deliveryProviderId) : query,
        options,
      );
    },

    findProviders: async (
      query: DeliveryProviderQuery = {},
      options: mongodb.FindOptions = { sort: { created: 1 } },
    ): Promise<DeliveryProvider[]> => {
      const providers = DeliveryProviders.find(buildFindSelector(query), options);
      return providers.toArray();
    },

    allProviders,

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
      allProviders.clear();
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
      allProviders.clear();
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
      allProviders.clear();
      await emit('DELIVERY_PROVIDER_REMOVE', { deliveryProvider });
      return deliveryProvider;
    },
  };
};

export type DeliveryModule = Awaited<ReturnType<typeof configureDeliveryModule>>;
