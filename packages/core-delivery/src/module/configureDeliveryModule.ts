import { DeliveryContext, DeliveryInterface, DeliveryProvider, DeliveryProviderType } from '../types.js';
import { emit, registerEvents } from '@unchainedshop/events';
import { mongodb, generateDbFilterById, generateDbObjectId, ModuleInput } from '@unchainedshop/mongodb';
import { DeliveryPricingSheet } from '../director/DeliveryPricingSheet.js';
import { DeliveryProvidersCollection } from '../db/DeliveryProvidersCollection.js';
import { deliverySettings, DeliverySettingsOptions } from '../delivery-settings.js';
import { DeliveryDirector } from '../director/DeliveryDirector.js';
import { DeliveryPricingContext, DeliveryPricingDirector } from '../director/DeliveryPricingDirector.js';
import { DeliveryError } from '../delivery-index.js';
import {
  DeliveryPricingCalculation,
  IDeliveryPricingSheet,
} from '../director/DeliveryPricingAdapter.js';
import type { Order } from '@unchainedshop/core-orders';

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
}: ModuleInput<DeliverySettingsOptions>) => {
  registerEvents(DELIVERY_PROVIDER_EVENTS);

  deliverySettings.configureSettings(deliveryOptions);

  const DeliveryProviders = await DeliveryProvidersCollection(db);

  const getDeliveryAdapter = async (
    deliveryProviderId: string,
    deliveryContext: DeliveryContext,
    unchainedAPI,
  ) => {
    const provider = await DeliveryProviders.findOne(generateDbFilterById(deliveryProviderId), {});

    return DeliveryDirector.actions(provider, deliveryContext, unchainedAPI);
  };

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
    ): Promise<Array<DeliveryProvider>> => {
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

    // Delivery Adapter
    findInterface: (paymentProvider: Pick<DeliveryProvider, 'adapterKey'>): DeliveryInterface => {
      const Adapter = DeliveryDirector.getAdapter(paymentProvider.adapterKey);
      if (!Adapter) return null;
      return {
        _id: Adapter.key,
        label: Adapter.label,
        version: Adapter.version,
      };
    },

    findInterfaces: ({ type }: { type: DeliveryProviderType }): Array<DeliveryInterface> => {
      return DeliveryDirector.getAdapters({
        adapterFilter: (Adapter) => Adapter.typeSupported(type),
      }).map((Adapter) => ({
        _id: Adapter.key,
        label: Adapter.label,
        version: Adapter.version,
      }));
    },

    findSupported: async (params: { order: Order }, unchainedAPI): Promise<Array<DeliveryProvider>> => {
      const foundProviders = await DeliveryProviders.find(buildFindSelector({})).toArray();
      const providers: DeliveryProvider[] = await asyncFilter(
        foundProviders,
        async (provider: DeliveryProvider) => {
          try {
            const director = await DeliveryDirector.actions(provider, params, unchainedAPI);
            return director.isActive();
          } catch {
            return false;
          }
        },
      );

      return deliverySettings.filterSupportedProviders(
        {
          providers,
          order: params.order,
        },
        unchainedAPI,
      );
    },

    configurationError: async (
      deliveryProvider: DeliveryProvider,
      unchainedAPI,
    ): Promise<DeliveryError> => {
      const director = await DeliveryDirector.actions(deliveryProvider, {}, unchainedAPI);
      return director.configurationError();
    },

    isActive: async (deliveryProvider: DeliveryProvider, unchainedAPI): Promise<boolean> => {
      const director = await DeliveryDirector.actions(deliveryProvider, {}, unchainedAPI);
      return Boolean(director.isActive());
    },

    isAutoReleaseAllowed: async (deliveryProvider: DeliveryProvider, unchainedAPI): Promise<boolean> => {
      const director = await DeliveryDirector.actions(deliveryProvider, {}, unchainedAPI);
      return Boolean(director.isAutoReleaseAllowed());
    },

    calculate: async (
      pricingContext: DeliveryPricingContext,
      unchainedAPI,
    ): Promise<Array<DeliveryPricingCalculation>> => {
      const pricing = await DeliveryPricingDirector.actions(pricingContext, unchainedAPI);
      return pricing.calculate();
    },

    send: async (
      deliveryProviderId: string,
      deliveryContext: DeliveryContext,
      unchainedAPI,
    ): Promise<any> => {
      const adapter = await getDeliveryAdapter(deliveryProviderId, deliveryContext, unchainedAPI);
      return adapter.send();
    },

    pricingSheet: (params: {
      calculation: Array<DeliveryPricingCalculation>;
      currency: string;
    }): IDeliveryPricingSheet => {
      return DeliveryPricingSheet(params);
    },

    // Mutations
    create: async (doc: DeliveryProvider): Promise<DeliveryProvider> => {
      const Adapter = DeliveryDirector.getAdapter(doc.adapterKey);
      if (!Adapter) return null;

      const { insertedId: deliveryProviderId } = await DeliveryProviders.insertOne({
        _id: generateDbObjectId(),
        created: new Date(),
        configuration: Adapter.initialConfiguration,
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
