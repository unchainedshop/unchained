import { ModuleInput, ModuleMutations } from '@unchainedshop/types/common';
import {
  WarehousingModule,
  WarehousingProvider,
  WarehousingProviderQuery,
} from '@unchainedshop/types/warehousing';
import { emit, registerEvents } from '@unchainedshop/events';
import { generateDbFilterById, generateDbMutations } from '@unchainedshop/utils';
import { WarehousingProvidersCollection } from '../db/WarehousingProvidersCollection';
import { WarehousingProvidersSchema } from '../db/WarehousingProvidersSchema';
import { WarehousingDirector } from '../director/WarehousingDirector';

const WAREHOUSING_PROVIDER_EVENTS: string[] = [
  'WAREHOUSING_PROVIDER_CREATE',
  'WAREHOUSING_PROVIDER_UPDATE',
  'WAREHOUSING_PROVIDER_REMOVE',
];

const buildFindSelector = ({ type }: WarehousingProviderQuery = {}) => {
  const query = type ? { type, deleted: null } : { deleted: null };
  return query;
};

const asyncFilter = async (arr, predicate) => {
  const results = await Promise.all(arr.map(predicate));

  return arr.filter((_v, index) => results[index]);
};

export const configureWarehousingModule = async ({
  db,
}: ModuleInput<Record<string, never>>): Promise<WarehousingModule> => {
  registerEvents(WAREHOUSING_PROVIDER_EVENTS);

  const WarehousingProviders = await WarehousingProvidersCollection(db);

  const mutations = generateDbMutations<WarehousingProvider>(
    WarehousingProviders,
    WarehousingProvidersSchema,
  ) as ModuleMutations<WarehousingProvider>;

  return {
    // Queries
    ...mutations,
    count: async (query) => {
      const providerCount = await WarehousingProviders.countDocuments(buildFindSelector(query));
      return providerCount;
    },

    findProvider: async ({ warehousingProviderId }, options) => {
      return WarehousingProviders.findOne(generateDbFilterById(warehousingProviderId), options);
    },

    findProviders: async (query, options) => {
      const providers = WarehousingProviders.find(buildFindSelector(query), options);
      return providers.toArray();
    },

    providerExists: async ({ warehousingProviderId }) => {
      const providerCount = await WarehousingProviders.countDocuments(
        generateDbFilterById(warehousingProviderId, { deleted: null }),
        { limit: 1 },
      );
      return !!providerCount;
    },

    // Adapter

    findInterface: (warehousingProvider) => {
      const Adapter = WarehousingDirector.getAdapter(warehousingProvider.adapterKey);
      if (!Adapter) return null;
      return {
        _id: Adapter.key,
        label: Adapter.label,
        version: Adapter.version,
      };
    },

    findInterfaces: ({ type }) => {
      return WarehousingDirector.getAdapters({
        adapterFilter: (Adapter) => Adapter.typeSupported(type),
      }).map((Adapter) => ({
        _id: Adapter.key,
        label: Adapter.label,
        version: Adapter.version,
      }));
    },

    findSupported: async (warehousingContext, requestContext) => {
      const allProviders = await WarehousingProviders.find(buildFindSelector({})).toArray();

      const providers = asyncFilter(allProviders, async (provider) => {
        const director = await WarehousingDirector.actions(provider, warehousingContext, requestContext);
        return director.isActive();
      });

      return providers;
    },

    configurationError: async (warehousingProvider, requestContext) => {
      const actions = await WarehousingDirector.actions(warehousingProvider, {}, requestContext);
      return actions.configurationError();
    },

    estimatedDispatch: async (warehousingProvider, warehousingContext, requestContext) => {
      const director = await WarehousingDirector.actions(
        warehousingProvider,
        warehousingContext,
        requestContext,
      );
      return director.estimatedDispatch();
    },

    estimatedStock: async (warehousingProvider, warehousingContext, requestContext) => {
      const director = await WarehousingDirector.actions(
        warehousingProvider,
        warehousingContext,
        requestContext,
      );
      return director.estimatedStock();
    },

    isActive: async (warehousingProvider, requestContext) => {
      const actions = await WarehousingDirector.actions(warehousingProvider, {}, requestContext);
      return actions.isActive();
    },

    // Mutations
    create: async (doc, userId) => {
      const Adapter = WarehousingDirector.getAdapter(doc.adapterKey);
      if (!Adapter) return null;

      const warehousingProviderId = await mutations.create(
        { configuration: Adapter.initialConfiguration, ...doc },
        userId,
      );

      const warehousingProvider = await WarehousingProviders.findOne(
        generateDbFilterById(warehousingProviderId),
      );
      emit('WAREHOUSING_PROVIDER_CREATE', { warehousingProvider });
      return warehousingProviderId;
    },

    update: async (_id: string, doc: WarehousingProvider, userId: string) => {
      const warehousingProviderId = await mutations.update(_id, doc, userId);
      const warehousingProvider = await WarehousingProviders.findOne(generateDbFilterById(_id), {});

      if (!warehousingProvider) return null;

      emit('WAREHOUSING_PROVIDER_UPDATE', { warehousingProvider });
      return warehousingProviderId;
    },

    delete: async (providerId, userId) => {
      await mutations.delete(providerId, userId);
      const warehousingProvider = await WarehousingProviders.findOne(
        generateDbFilterById(providerId),
        {},
      );

      emit('WAREHOUSING_PROVIDER_REMOVE', { warehousingProvider });

      return warehousingProvider;
    },
  };
};