import { ModuleInput, ModuleMutations, UnchainedCore } from '@unchainedshop/types/core.js';
import {
  DeliveryContext,
  DeliveryModule,
  DeliveryProvider,
  DeliverySettingsOptions,
} from '@unchainedshop/types/delivery.js';
import { emit, registerEvents } from '@unchainedshop/events';
import { mongodb, generateDbFilterById, generateDbMutations } from '@unchainedshop/mongodb';
import { DeliveryPricingSheet } from '../director/DeliveryPricingSheet.js';
import { DeliveryProvidersCollection } from '../db/DeliveryProvidersCollection.js';
import { DeliveryProvidersSchema } from '../db/DeliveryProvidersSchema.js';
import { deliverySettings } from '../delivery-settings.js';
import { DeliveryDirector } from '../director/DeliveryDirector.js';
import { DeliveryPricingDirector } from '../director/DeliveryPricingDirector.js';

const DELIVERY_PROVIDER_EVENTS: string[] = [
  'DELIVERY_PROVIDER_CREATE',
  'DELIVERY_PROVIDER_UPDATE',
  'DELIVERY_PROVIDER_REMOVE',
];

const asyncFilter = async (arr, predicate) => {
  const results = await Promise.all(arr.map(predicate));

  return arr.filter((_v, index) => results[index]);
};

export const buildFindSelector = ({ type }: mongodb.Filter<DeliveryProvider> = {}) => {
  return { ...(type ? { type } : {}), deleted: null };
};

export const configureDeliveryModule = async ({
  db,
  options: deliveryOptions = {},
}: ModuleInput<DeliverySettingsOptions>): Promise<DeliveryModule> => {
  registerEvents(DELIVERY_PROVIDER_EVENTS);

  deliverySettings.configureSettings(deliveryOptions);

  const DeliveryProviders = await DeliveryProvidersCollection(db);

  const mutations = generateDbMutations<DeliveryProvider>(
    DeliveryProviders,
    DeliveryProvidersSchema,
  ) as ModuleMutations<DeliveryProvider>;

  const getDeliveryAdapter = async (
    deliveryProviderId: string,
    deliveryContext: DeliveryContext,
    unchainedAPI: UnchainedCore,
  ) => {
    const provider = await DeliveryProviders.findOne(generateDbFilterById(deliveryProviderId), {});

    return DeliveryDirector.actions(provider, deliveryContext, unchainedAPI);
  };

  return {
    // Queries
    count: async (query) => {
      const providerCount = await DeliveryProviders.countDocuments(buildFindSelector(query));
      return providerCount;
    },

    findProvider: async ({ deliveryProviderId, ...query }, options) => {
      return DeliveryProviders.findOne(
        deliveryProviderId ? generateDbFilterById(deliveryProviderId) : query,
        options,
      );
    },

    findProviders: async (query, options) => {
      const providers = DeliveryProviders.find(buildFindSelector(query), options);
      return providers.toArray();
    },

    providerExists: async ({ deliveryProviderId }) => {
      const providerCount = await DeliveryProviders.countDocuments(
        generateDbFilterById(deliveryProviderId, { deleted: null }),
        { limit: 1 },
      );
      return !!providerCount;
    },

    // Delivery Adapter

    findInterface: (paymentProvider) => {
      const Adapter = DeliveryDirector.getAdapter(paymentProvider.adapterKey);
      if (!Adapter) return null;
      return {
        _id: Adapter.key,
        label: Adapter.label,
        version: Adapter.version,
      };
    },

    findInterfaces: ({ type }) => {
      return DeliveryDirector.getAdapters({
        adapterFilter: (Adapter) => Adapter.typeSupported(type),
      }).map((Adapter) => ({
        _id: Adapter.key,
        label: Adapter.label,
        version: Adapter.version,
      }));
    },

    findSupported: async (deliveryContext, unchainedAPI) => {
      const foundProviders = await DeliveryProviders.find(buildFindSelector({})).toArray();
      const providers: DeliveryProvider[] = await asyncFilter(
        foundProviders,
        async (provider: DeliveryProvider) => {
          try {
            const director = await DeliveryDirector.actions(provider, deliveryContext, unchainedAPI);
            return director.isActive();
          } catch {
            return false;
          }
        },
      );

      return deliverySettings.filterSupportedProviders(
        {
          providers,
          order: deliveryContext.order,
        },
        unchainedAPI,
      );
    },

    determineDefault: async (deliveryProviders, deliveryContext, unchainedAPI) => {
      return deliverySettings.determineDefaultProvider(
        {
          providers: deliveryProviders,
          ...deliveryContext,
        },
        unchainedAPI,
      );
    },

    configurationError: async (deliveryProvider, unchainedAPI) => {
      const director = await DeliveryDirector.actions(deliveryProvider, {}, unchainedAPI);
      return director.configurationError();
    },

    isActive: async (deliveryProvider, unchainedAPI) => {
      const director = await DeliveryDirector.actions(deliveryProvider, {}, unchainedAPI);
      return Boolean(director.isActive());
    },

    isAutoReleaseAllowed: async (deliveryProvider, unchainedAPI) => {
      const director = await DeliveryDirector.actions(deliveryProvider, {}, unchainedAPI);
      return Boolean(director.isAutoReleaseAllowed());
    },

    calculate: async (pricingContext, unchainedAPI) => {
      const pricing = await DeliveryPricingDirector.actions(pricingContext, unchainedAPI);
      return pricing.calculate();
    },

    send: async (deliveryProviderId, deliveryContext, unchainedAPI) => {
      const adapter = await getDeliveryAdapter(deliveryProviderId, deliveryContext, unchainedAPI);
      return adapter.send();
    },

    pricingSheet: (params) => {
      return DeliveryPricingSheet(params);
    },

    // Mutations
    create: async (doc) => {
      const Adapter = DeliveryDirector.getAdapter(doc.adapterKey);
      if (!Adapter) return null;

      const deliveryProviderId = await mutations.create({
        configuration: Adapter.initialConfiguration,
        ...doc,
      });
      const deliveryProvider = await DeliveryProviders.findOne(
        generateDbFilterById(deliveryProviderId),
        {},
      );
      await emit('DELIVERY_PROVIDER_CREATE', { deliveryProvider });
      return deliveryProvider;
    },

    update: async (_id: string, doc: DeliveryProvider) => {
      await mutations.update(_id, doc);
      const deliveryProvider = await DeliveryProviders.findOne(generateDbFilterById(_id), {});
      await emit('DELIVERY_PROVIDER_UPDATE', { deliveryProvider });
      return deliveryProvider;
    },

    delete: async (_id) => {
      await mutations.delete(_id);
      const deliveryProvider = await DeliveryProviders.findOne(generateDbFilterById(_id), {});
      await emit('DELIVERY_PROVIDER_REMOVE', { deliveryProvider });
      return deliveryProvider;
    },

    deletePermanently: async (_id) => {
      const deliveryProvider = await DeliveryProviders.findOne(generateDbFilterById(_id), {});
      await mutations.deletePermanently(_id);
      return deliveryProvider;
    },
  };
};
