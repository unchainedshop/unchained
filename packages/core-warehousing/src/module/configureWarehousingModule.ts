import { ModuleInput, ModuleMutations } from '@unchainedshop/types/common';
import {
  WarehousingModule,
  WarehousingProvider,
  WarehousingProviderType,
} from '@unchainedshop/types/warehousing';
import { emit, registerEvents } from 'meteor/unchained:events';
import { generateDbFilterById, generateDbMutations } from 'meteor/unchained:utils';
import { WarehousingProvidersCollection } from '../db/WarehousingProvidersCollection';
import { WarehousingProvidersSchema } from '../db/WarehousingProvidersSchema';
import { WarehousingDirector } from '../director/WarehousingDirector';

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
    count: async (query) => {
      const providerCount = await WarehousingProviders.find(buildFindSelector(query)).count();
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
      const providerCount = await WarehousingProviders.find(
        generateDbFilterById(warehousingProviderId, { deleted: null }),
        { limit: 1 },
      ).count();
      return !!providerCount;
    },

    // Adapter

    findInterface: (warehousingProvider) => {
      const Adapter = WarehousingDirector.getAdapter(warehousingProvider.adapterKey);
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
      const providers = await WarehousingProviders.find(buildFindSelector({})).toArray();
      return providers.filter((provider) => {
        const Adapter = WarehousingDirector.actions(provider, warehousingContext, requestContext);

        return Adapter.isActive();
      });
    },

    configurationError: async (provider, requestContext) => {
      return WarehousingDirector.actions(provider, {}, requestContext).configurationError();
    },

    estimatedDispatch: async (warehousingProvider, warehousingContext, requestContext) => {
      const director = WarehousingDirector.actions(
        warehousingProvider,
        warehousingContext,
        requestContext,
      );
      return director.estimatedDispatch();
    },

    isActive: async (warehousingProvider, requestContext) => {
      return WarehousingDirector.actions(warehousingProvider, {}, requestContext).isActive();
    },

    // Mutations
    create: async (doc, userId) => {
      const Adapter = WarehousingDirector.getAdapter(doc.adapterKey);
      if (!Adapter) return null;

      const warehousingProviderId = await mutations.create({ configuration: [], ...doc }, userId);

      const warehousingProvider = await WarehousingProviders.findOne(
        generateDbFilterById(warehousingProviderId),
      );
      emit('WAREHOUSING_PROVIDER_CREATE', { warehousingProvider });
      return warehousingProviderId;
    },

    update: async (_id: string, doc: WarehousingProvider, userId: string) => {
      const warehousingProviderId = await mutations.update(_id, doc, userId);
      const warehousingProvider = await WarehousingProviders.findOne(generateDbFilterById(_id));
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
