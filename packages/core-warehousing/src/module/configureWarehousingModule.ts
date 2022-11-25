import { ModuleInput, ModuleMutations } from '@unchainedshop/types/core';
import {
  WarehousingContext,
  WarehousingModule,
  WarehousingProvider,
  WarehousingProviderQuery,
  WarehousingProviderType,
} from '@unchainedshop/types/warehousing';
import { emit, registerEvents } from '@unchainedshop/events';
import { generateDbFilterById, generateDbMutations } from '@unchainedshop/utils';
import { WarehousingProvidersCollection } from '../db/WarehousingProvidersCollection';
import { WarehousingProvidersSchema } from '../db/WarehousingProvidersSchema';
import { WarehousingDirector } from '../director/WarehousingDirector';
import { TokenSurrogateCollection } from '../db/TokenSurrogateCollection';

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
  const TokenSurrogates = await TokenSurrogateCollection(db);

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

    findToken: async ({ tokenId }, options) => {
      return TokenSurrogates.findOne(generateDbFilterById(tokenId), options);
    },

    findTokens: async (selector, options) => {
      return TokenSurrogates.find(selector, options).toArray();
    },

    findTokensForUser: async (user, options) => {
      const addresses = user.services?.web3?.flatMap((service) => {
        return service.verified ? [service.address] : [];
      });

      const selector = {
        $or: [
          {
            walletAddress: { $in: addresses || [] },
          },
          {
            userId: user._id,
          },
        ],
      };

      const userTokens = await TokenSurrogates.find(selector, options).toArray();
      return userTokens;
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

    updateTokenOwnership: async ({ tokenId, userId, walletAddress }) => {
      await TokenSurrogates.updateOne(
        { _id: tokenId },
        {
          $set: {
            userId,
            walletAddress,
          },
        },
      );
    },

    tokenizeItems: async (order, { items }, requestContext) => {
      const virtualProviders = await WarehousingProviders.find(
        buildFindSelector({ type: WarehousingProviderType.VIRTUAL }),
      ).toArray();

      await Promise.all(
        items.map(async ({ orderPosition, product }) => {
          const warehousingContext: WarehousingContext = {
            order,
            orderPosition,
            product,
            quantity: orderPosition.quantity,
            referenceDate: order.ordered,
          };
          await virtualProviders.reduce(async (lastPromise, provider) => {
            const last = await lastPromise;
            if (last) return last;
            const currentDirector = await WarehousingDirector.actions(
              provider,
              warehousingContext,
              requestContext,
            );
            const isActive = await currentDirector.isActive();
            if (isActive) {
              const tokenSurrogates = await currentDirector.tokenize();
              await TokenSurrogates.insertMany(tokenSurrogates);
            }
            return true;
          }, Promise.resolve(false));
        }),
      );
    },

    tokenMetadata: async (chainTokenId, { token, product, referenceDate }, requestContext) => {
      const virtualProviders = await WarehousingProviders.find(
        buildFindSelector({ type: WarehousingProviderType.VIRTUAL }),
      ).toArray();

      const warehousingContext: WarehousingContext = {
        product,
        token,
        quantity: token?.quantity || 1,
        referenceDate,
      };
      return virtualProviders.reduce(async (lastPromise, provider) => {
        const last = await lastPromise;
        if (last) return last;
        const currentDirector = await WarehousingDirector.actions(
          provider,
          warehousingContext,
          requestContext,
        );
        const isActive = await currentDirector.isActive();
        if (isActive) {
          return currentDirector.tokenMetadata(chainTokenId);
        }
        return null;
      }, Promise.resolve(null));
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
      await emit('WAREHOUSING_PROVIDER_CREATE', { warehousingProvider });
      return warehousingProviderId;
    },

    update: async (_id: string, doc: WarehousingProvider, userId: string) => {
      const warehousingProviderId = await mutations.update(_id, doc, userId);
      const warehousingProvider = await WarehousingProviders.findOne(generateDbFilterById(_id), {});

      if (!warehousingProvider) return null;

      await emit('WAREHOUSING_PROVIDER_UPDATE', { warehousingProvider });
      return warehousingProviderId;
    },

    delete: async (providerId, userId) => {
      await mutations.delete(providerId, userId);
      const warehousingProvider = await WarehousingProviders.findOne(
        generateDbFilterById(providerId),
        {},
      );

      await emit('WAREHOUSING_PROVIDER_REMOVE', { warehousingProvider });

      return warehousingProvider;
    },
  };
};
