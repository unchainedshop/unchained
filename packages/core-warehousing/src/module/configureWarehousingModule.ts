import { ModuleInput, ModuleMutations } from '@unchainedshop/types/common';
import {
  WarehousingContext,
  WarehousingModule,
  WarehousingProvider,
  WarehousingProviderType,
} from '@unchainedshop/types/warehousing';
import { emit, registerEvents } from 'meteor/unchained:events';
import {
  generateDbFilterById,
  generateDbMutations,
} from 'meteor/unchained:utils';
import { WarehousingProvidersCollection } from 'src/db/WarehousingProvidersCollection';
import { WarehousingProvidersSchema } from '../db/WarehousingProvidersSchema';
import { WarehousingAdapter } from '../director/WarehousingAdapter';
import {
  getAdapter,
  getFilteredAdapters,
  WarehousingDirector,
} from '../director/WarehousingDirector';

const WAREHOUSING_PROVIDER_EVENTS: string[] = [
  'WAREHOUSING_PROVIDER_CREATE',
  'WAREHOUSING_PROVIDER_UPDATE',
  'WAREHOUSING_PROVIDER_REMOVE',
];

type FindQuery = {
  type?: WarehousingProviderType;
  deleted?: Date | null;
};

const buildFindSelector = ({ type, deleted = null }: FindQuery = {}) => {
  const query = type ? { type, deleted } : { deleted };
  return query;
};

const getDefaultContext = (
  context?: WarehousingContext
): WarehousingContext => {
  return context || {};
};

export const configureWarehousingModule = async ({
  db,
}: ModuleInput): Promise<WarehousingModule> => {
  registerEvents(WAREHOUSING_PROVIDER_EVENTS);

  const WarehousingProviders = await WarehousingProvidersCollection(db);

  const mutations = generateDbMutations<WarehousingProvider>(
    WarehousingProviders,
    WarehousingProvidersSchema
  ) as ModuleMutations<WarehousingProvider>;

  return {
    // Queries
    count: async (query) => {
      const providerCount = await WarehousingProviders.find(
        buildFindSelector(query)
      ).count();
      return providerCount;
    },

    findProvider: async ({ warehousingProviderId }, options) => {
      return await WarehousingProviders.findOne(
        generateDbFilterById(warehousingProviderId),
        options
      );
    },

    findProviders: async (query, options) => {
      const providers = WarehousingProviders.find(
        buildFindSelector(query),
        options
      );
      return await providers.toArray();
    },

    providerExists: async ({ warehousingProviderId }) => {
      const providerCount = await WarehousingProviders.find(
        generateDbFilterById(warehousingProviderId, { deleted: null }),
        { limit: 1 }
      ).count();
      return !!providerCount;
    },

    findInterface: (warehousingProvider) => {
      const Adapter = getAdapter(warehousingProvider);
      return {
        _id: Adapter.key,
        label: Adapter.label,
        version: Adapter.version,
      };
    },

    findInterfaces: ({ type }) => {
      return getFilteredAdapters((Adapter: typeof WarehousingAdapter) =>
        Adapter.typeSupported(type)
      ).map((Adapter) => ({
        _id: Adapter.key,
        label: Adapter.label,
        version: Adapter.version,
      }));
    },

    findSupported: async () => {
      const providers = WarehousingProviders.find(buildFindSelector({})).filter(
        (provider: WarehousingProvider) =>
          WarehousingDirector(provider).isActive()
      );

      return await providers.toArray();
    },

    // Adapter

    configurationError: (provider: WarehousingProvider) => {
      return WarehousingDirector(provider).configurationError();
    },
    isActive: (provider: WarehousingProvider) => {
      return WarehousingDirector(provider).isActive();
    },

    // Mutations
    create: async (doc, userId) => {
      const Adapter = getAdapter(doc);
      if (!Adapter) return null;

      const warehousingProviderId = await mutations.create(
        { configuration: [], ...doc },
        userId
      );

      const warehousingProvider = await WarehousingProviders.findOne(
        generateDbFilterById(warehousingProviderId)
      );
      emit('WAREHOUSING_PROVIDER_CREATE', { warehousingProvider });
      return warehousingProviderId;
    },

    update: async (_id: string, doc: WarehousingProvider, userId: string) => {
      const warehousingProviderId = await mutations.update(_id, doc, userId);
      const warehousingProvider = await WarehousingProviders.findOne(
        generateDbFilterById(_id)
      );
      emit('WAREHOUSING_PROVIDER_UPDATE', { warehousingProvider });

      return warehousingProviderId;
    },

    delete: async (_id, userId) => {
      const deletedCount = await mutations.delete(_id, userId);
      const warehousingProvider = WarehousingProviders.findOne(
        generateDbFilterById(_id)
      );

      emit('WAREHOUSING_PROVIDER_REMOVE', { warehousingProvider });
      return deletedCount;
    },
  };
};
