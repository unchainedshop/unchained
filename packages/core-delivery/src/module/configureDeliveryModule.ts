import { Context } from '@unchainedshop/types/api';
import { ModuleInput, ModuleMutations } from '@unchainedshop/types/common';
import {
  DeliveryContext,
  DeliveryModule,
  DeliveryProvider,
  DeliveryProviderType,
  DeliverySettingsOptions,
} from '@unchainedshop/types/delivery';
import { PaymentProvider } from '@unchainedshop/types/payments';
import { emit, registerEvents } from 'meteor/unchained:events';
import { generateDbFilterById, generateDbMutations } from 'meteor/unchained:utils';
import { DeliveryPricingSheet } from '../director/DeliveryPricingSheet';
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

const asyncFilter = async (arr, predicate) => {
  const results = await Promise.all(arr.map(predicate));

  return arr.filter((_v, index) => results[index]);
};

type FindQuery = {
  type?: DeliveryProviderType;
  deleted?: Date | null;
};

const buildFindSelector = ({ type }: FindQuery = {}) => {
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
    requestContext: Context,
  ) => {
    const provider = await DeliveryProviders.findOne(generateDbFilterById(deliveryProviderId), {});

    return DeliveryDirector.actions(provider, deliveryContext, requestContext);
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

    findInterface: (deliveryProvider) => {
      return DeliveryDirector.getAdapter(deliveryProvider.adapterKey);
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

    findSupported: async (deliveryContext, requestContext) => {
      const foundProviders = await DeliveryProviders.find(buildFindSelector({})).toArray();
      const providers: PaymentProvider[] = await asyncFilter(
        foundProviders,
        async (provider: DeliveryProvider) => {
          try {
            const director = await DeliveryDirector.actions(provider, deliveryContext, requestContext);
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
        requestContext,
      );
    },

    determineDefault: async (deliveryProviders, deliveryContext, requestContext) => {
      return deliverySettings.determineDefaultProvider(
        {
          providers: deliveryProviders,
          ...deliveryContext,
        },
        requestContext,
      );
    },

    configurationError: async (deliveryProvider, requestContext) => {
      const director = await DeliveryDirector.actions(deliveryProvider, {}, requestContext);
      return director.configurationError();
    },

    isActive: async (deliveryProvider, requestContext) => {
      const director = await DeliveryDirector.actions(deliveryProvider, {}, requestContext);
      return Boolean(director.isActive());
    },

    isAutoReleaseAllowed: async (deliveryProvider, requestContext) => {
      const director = await DeliveryDirector.actions(deliveryProvider, {}, requestContext);
      return Boolean(director.isAutoReleaseAllowed());
    },

    calculate: async (pricingContext, requestContext) => {
      const pricing = await DeliveryPricingDirector.actions(pricingContext, requestContext);
      return pricing.calculate();
    },

    send: async (deliveryProviderId, deliveryContext, requestContext) => {
      const adapter = await getDeliveryAdapter(deliveryProviderId, deliveryContext, requestContext);
      return adapter.send();
    },

    pricingSheet: (params) => {
      return DeliveryPricingSheet(params);
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
        userId,
      );
      const deliveryProvider = await DeliveryProviders.findOne(
        generateDbFilterById(deliveryProviderId),
        {},
      );
      emit('DELIVERY_PROVIDER_CREATE', { deliveryProvider });
      return deliveryProvider;
    },

    update: async (_id: string, doc: DeliveryProvider, userId: string) => {
      await mutations.update(_id, doc, userId);
      const deliveryProvider = await DeliveryProviders.findOne(generateDbFilterById(_id), {});
      emit('DELIVERY_PROVIDER_UPDATE', { deliveryProvider });
      return deliveryProvider;
    },

    delete: async (_id, userId) => {
      await mutations.delete(_id, userId);
      const deliveryProvider = await DeliveryProviders.findOne(generateDbFilterById(_id), {});
      emit('DELIVERY_PROVIDER_REMOVE', { deliveryProvider });
      return deliveryProvider;
    },

    deletePermanently: async (_id, userId) => {
      const deliveryProvider = await DeliveryProviders.findOne(generateDbFilterById(_id), {});
      await mutations.deletePermanently(_id, userId);
      return deliveryProvider;
    },
  };
};
