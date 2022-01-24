import { Context } from '@unchainedshop/types/api';
import { ModuleInput, ModuleMutations } from '@unchainedshop/types/common';
import {
  DeliveryContext,
  DeliveryModule,
  DeliveryProvider,
  DeliveryProviderType,
  DeliverySettingsOptions,
} from '@unchainedshop/types/delivery';
import { emit, registerEvents } from 'meteor/unchained:events';
import {
  generateDbFilterById,
  generateDbMutations,
} from 'meteor/unchained:utils';
import { DeliveryProvidersCollection } from '../db/DeliveryProvidersCollection';
import { DeliveryProvidersSchema } from '../db/DeliveryProvidersSchema';
import { deliverySettings } from '../delivery-settings';
import { DeliveryDirector } from '../director/DeliveryDirector';
import { DeliveryPricingDirector } from '../director/DeliveryPricingDirector';

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
  options,
}: ModuleInput<DeliverySettingsOptions>): Promise<DeliveryModule> => {
  registerEvents(DELIVERY_PROVIDER_EVENTS);

  deliverySettings.configureSettings(options);

  const DeliveryProviders = await DeliveryProvidersCollection(db);

  const mutations = generateDbMutations<DeliveryProvider>(
    DeliveryProviders,
    DeliveryProvidersSchema
  ) as ModuleMutations<DeliveryProvider>;

  const getDeliveryAdapter = async (
    deliveryProviderId: string,
    deliveryContext: DeliveryContext,
    requestContext: Context
  ) => {
    const provider = await DeliveryProviders.findOne(
      generateDbFilterById(deliveryProviderId),
      {}
    );

    return DeliveryDirector.actions(provider, deliveryContext, requestContext);
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
      return DeliveryDirector.getAdapter(deliveryProvider.adapterKey);
    },

    findInterfaces: ({ type }) => {
      return DeliveryDirector.getAdapters({
        adapterFilter: async (Adapter) => Adapter.typeSupported(type),
      }).map((Adapter) => ({
        _id: Adapter.key,
        label: Adapter.label,
        version: Adapter.version,
      }));
    },

    findSupported: async ({ order }, requestContext) => {
      const providers = await DeliveryProviders.find({})
        .filter((provider: DeliveryProvider) => {
          const director = DeliveryDirector.actions(
            provider,
            getDefaultContext({ order }),
            requestContext
          );
          return director.isActive();
        })
        .toArray();

      return deliverySettings.filterSupportedProviders({
        providers,
      });
    },

    isAutoReleaseAllowed: (deliveryProvider, requestContext) => {
      const director = DeliveryDirector.actions(
        deliveryProvider,
        {},
        requestContext
      );

      if (director.isAutoReleaseAllowed()) return false;

      return true;
    },

    calculate: async (pricingContext, requestContext) => {
      const pricing = await DeliveryPricingDirector.actions(
        pricingContext,
        requestContext
      );
      return await pricing.calculate();
    },

    send: async (deliveryProviderId, deliveryContext, requestContext) => {
      const adapter = await getDeliveryAdapter(
        deliveryProviderId,
        deliveryContext,
        requestContext
      );
      adapter.send();
    },

    // Mutations
    create: async (doc, userId) => {
      const Adapter = DeliveryDirector.getAdapter(doc.adapterKey);
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

      return deliveryProvider;
    },

    update: async (_id: string, doc: DeliveryProvider, userId: string) => {
      await mutations.update(_id, doc, userId);
      const deliveryProvider = await DeliveryProviders.findOne(
        generateDbFilterById(_id)
      );
      emit('DELIVERY_PROVIDER_UPDATE', { deliveryProvider });

      return deliveryProvider;
    },

    delete: async (_id, userId) => {
      await mutations.delete(_id, userId);
      const deliveryProvider = await DeliveryProviders.findOne(
        generateDbFilterById(_id)
      );

      emit('DELIVERY_PROVIDER_REMOVE', { deliveryProvider });

      return deliveryProvider;
    },
  };
};
