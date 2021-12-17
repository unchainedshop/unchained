import { ModuleInput, ModuleMutations } from '@unchainedshop/types/common';
import {
  DeliveryContext,
  DeliveryModule,
  DeliveryProvider,
  DeliveryProviderType,
} from '@unchainedshop/types/delivery';
import { emit, registerEvents } from 'meteor/unchained:director-events';
import {
  generateDbFilterById,
  generateDbMutations,
} from 'meteor/unchained:utils';
import { DeliveryProvidersCollection } from 'src/db/DeliveryProvidersCollection';
import { deliverySettings } from 'src/delivery-settings';
import { DeliveryProvidersSchema } from '../db/DeliveryProvidersSchema';
import { DeliveryAdapter } from '../director/DeliveryAdapter';
import {
  DeliveryDirector,
  getAdapter,
  getAdapters,
} from '../director/DeliveryDirector';

const DELIVERY_PROVIDER_EVENTS: string[] = [
  'DELIVERY_PROVIDER_CREATE',
  'DELIVERY_PROVIDER_UPDATE',
  'DELIVERY_PROVIDER_REMOVE',
];

type FindQuery = {
  type?: DeliveryProviderType;
  deleted?: Date | null;
};

const buildFindSelector = ({ type, deleted = null }: FindQuery = {}) => {
  return { ...(type ? { type } : {}), deleted };
};

const getDefaultContext = (context?: DeliveryContext): DeliveryContext => {
  return context || {};
};

export const configureDeliveryModule = async ({
  db,
}: ModuleInput): Promise<DeliveryModule> => {
  registerEvents(DELIVERY_PROVIDER_EVENTS);

  const DeliveryProviders = await DeliveryProvidersCollection(db);

  const mutations = generateDbMutations<DeliveryProvider>(
    DeliveryProviders,
    DeliveryProvidersSchema
  ) as ModuleMutations<DeliveryProvider>;

  const getDeliveryAdapter = async (
    deliveryProviderId: string,
    context: DeliveryContext
  ) => {
    const provider = await DeliveryProviders.findOne({
      _id: generateDbFilterById(deliveryProviderId)._id,
    });

    return;
  };

  return {
    // Queries
    count: async (query) => {
      const providerCount = await DeliveryProviders.find(
        buildFindSelector(query)
      ).count();
      return providerCount;
    },

    findProvider: async ({ deliveryProviderId, ...query }, options) => {
      return await DeliveryProviders.findOne(
        deliveryProviderId ? generateDbFilterById(deliveryProviderId) : query,
        options
      );
    },

    findProviders: async (query, options) => {
      const providers = DeliveryProviders.find(
        buildFindSelector(query),
        options
      );
      return await providers.toArray();
    },

    providerExists: async ({ deliveryProviderId }) => {
      const providerCount = await DeliveryProviders.find(
        generateDbFilterById(deliveryProviderId, { deleted: null }),
        { limit: 1 }
      ).count();
      return !!providerCount;
    },

    // Delivery Adapter

    findInterface: (deliveryProvider) => {
      const Adapter = getAdapter(deliveryProvider);
      return {
        _id: Adapter.key,
        label: Adapter.label,
        version: Adapter.version,
      };
    },

    findInterfaces: ({ type }) => {
      return getAdapters((Adapter: typeof DeliveryAdapter) =>
        Adapter.typeSupported(type)
      ).map((Adapter) => ({
        _id: Adapter.key,
        label: Adapter.label,
        version: Adapter.version,
      }));
    },

    findSupported: (deliveryContext, requestContext) => {
      const providers = DeliveryProviders.find({}).filter(
        (provider: DeliveryProvider) => {
          const director = DeliveryDirector(
            provider,
            getDefaultContext(deliveryContext),
            requestContext
          );
          return director.isActive();
        }
      );

      return deliverySettings.filterSupportedProviders({
        providers,
      });
    },

    // Mutations
    create: async (doc, userId) => {
      const Adapter = getAdapter(doc);
      if (!Adapter) return null;

      const deliveryProviderId = await mutations.create(
        {
          configuration: Adapter.initialConfiguration,
          ...doc,
        },
        userId
      );

      const deliveryProvider = await DeliveryProviders.findOne(
        generateDbFilterById(deliveryProviderId)
      );

      emit('DELIVERY_PROVIDER_CREATE', { deliveryProvider });

      return deliveryProviderId;
    },

    update: async (_id: string, doc: DeliveryProvider, userId: string) => {
      const deliveryProviderId = await mutations.update(_id, doc, userId);
      const deliveryProvider = await DeliveryProviders.findOne(
        generateDbFilterById(_id)
      );
      emit('DELIVERY_PROVIDER_UPDATE', { deliveryProvider });

      return deliveryProviderId;
    },

    delete: async (_id, userId) => {
      const deletedCount = await mutations.delete(_id, userId);
      const deliveryProvider = DeliveryProviders.findOne(
        generateDbFilterById(_id)
      );

      emit('DELIVERY_PROVIDER_REMOVE', { deliveryProvider });
      return deletedCount;
    },
  };
};
