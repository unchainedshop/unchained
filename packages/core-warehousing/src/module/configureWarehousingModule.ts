import type { User } from '@unchainedshop/core-users';

import { ModuleInput, ModuleMutations, UnchainedCore } from '@unchainedshop/core';
import {
  WarehousingContext,
  WarehousingProvider,
  WarehousingProviderQuery,
  WarehousingProviderType,
} from '../types.js';
import { emit, registerEvents } from '@unchainedshop/events';
import { generateDbFilterById, generateDbMutations, mongodb } from '@unchainedshop/mongodb';
import { WarehousingProvidersCollection } from '../db/WarehousingProvidersCollection.js';
import { WarehousingDirector } from '../director/WarehousingDirector.js';
import { TokenSurrogateCollection } from '../db/TokenSurrogateCollection.js';
import { EstimatedDispatch, EstimatedStock, TokenSurrogate, WarehousingInterface } from '../types.js';
import { WarehousingError } from '../warehousing-index.js';
import { Order } from '@unchainedshop/core-orders';
import { OrderPosition } from '@unchainedshop/core-orders';
import { Product } from '@unchainedshop/core-products';

export type WarehousingModule = {
  // Queries
  findProvider: (
    query: { warehousingProviderId: string },
    options?: mongodb.FindOptions,
  ) => Promise<WarehousingProvider>;
  findToken: (query: { tokenId: string }, options?: mongodb.FindOptions) => Promise<TokenSurrogate>;
  findTokensForUser: (user: User, options?: mongodb.FindOptions) => Promise<Array<TokenSurrogate>>;
  findTokens: (query: any, options?: mongodb.FindOptions) => Promise<Array<TokenSurrogate>>;
  findProviders: (
    query: WarehousingProviderQuery,
    options?: mongodb.FindOptions,
  ) => Promise<Array<WarehousingProvider>>;
  count: (query: WarehousingProviderQuery) => Promise<number>;
  providerExists: (query: { warehousingProviderId: string }) => Promise<boolean>;

  // Adapter

  findSupported: (
    warehousingContext: WarehousingContext,
    unchainedAPI: UnchainedCore,
  ) => Promise<Array<WarehousingProvider>>;
  findInterface: (query: WarehousingProvider) => WarehousingInterface;
  findInterfaces: (query: WarehousingProviderQuery) => Array<WarehousingInterface>;
  configurationError: (
    provider: WarehousingProvider,
    unchainedAPI: UnchainedCore,
  ) => Promise<WarehousingError>;
  isActive: (provider: WarehousingProvider, unchainedAPI: UnchainedCore) => Promise<boolean>;

  estimatedDispatch: (
    provider: WarehousingProvider,
    context: WarehousingContext,
    unchainedAPI: UnchainedCore,
  ) => Promise<EstimatedDispatch>;

  estimatedStock: (
    provider: WarehousingProvider,
    context: WarehousingContext,
    unchainedAPI: UnchainedCore,
  ) => Promise<EstimatedStock>;

  updateTokenOwnership: (input: {
    tokenId: string;
    userId: string;
    walletAddress: string;
  }) => Promise<void>;

  invalidateToken: (tokenId: string) => Promise<void>;

  buildAccessKeyForToken: (tokenId: string) => Promise<string>;

  tokenizeItems: (
    order: Order,
    params: {
      items: Array<{
        orderPosition: OrderPosition;
        product: Product;
      }>;
    },
    unchainedAPI: UnchainedCore,
  ) => Promise<void>;

  tokenMetadata: (
    chainTokenId: string,
    params: { product: Product; token: TokenSurrogate; referenceDate: Date; locale: Intl.Locale },
    unchainedAPI: UnchainedCore,
  ) => Promise<any>;

  isInvalidateable: (
    chainTokenId: string,
    params: { product: Product; token: TokenSurrogate; referenceDate: Date },
    unchainedAPI: UnchainedCore,
  ) => Promise<boolean>;

  // Mutations
  delete: (providerId: string) => Promise<WarehousingProvider>;
  update: (_id: string, doc: WarehousingProvider) => Promise<string>;
  create: (doc: WarehousingProvider) => Promise<string | null>;
};

const WAREHOUSING_PROVIDER_EVENTS: string[] = [
  'WAREHOUSING_PROVIDER_CREATE',
  'WAREHOUSING_PROVIDER_UPDATE',
  'WAREHOUSING_PROVIDER_REMOVE',
  'TOKEN_OWNERSHIP_CHANGED',
  'TOKEN_INVALIDATED',
];

export const buildFindSelector = ({ type }: WarehousingProviderQuery = {}) => {
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
      const addresses =
        user.services?.web3?.flatMap((service) => {
          return service.verified ? [service.address] : [];
        }) || [];
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

    findProviders: async (query, options = { sort: { created: 1 } }) => {
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

    findSupported: async (warehousingContext, unchainedAPI) => {
      const allProviders = await WarehousingProviders.find(buildFindSelector({})).toArray();

      const providers = asyncFilter(allProviders, async (provider) => {
        const director = await WarehousingDirector.actions(provider, warehousingContext, unchainedAPI);
        return director.isActive();
      });

      return providers;
    },

    configurationError: async (warehousingProvider, unchainedAPI) => {
      const actions = await WarehousingDirector.actions(warehousingProvider, {}, unchainedAPI);
      return actions.configurationError();
    },

    estimatedDispatch: async (warehousingProvider, warehousingContext, unchainedAPI) => {
      const director = await WarehousingDirector.actions(
        warehousingProvider,
        warehousingContext,
        unchainedAPI,
      );
      return director.estimatedDispatch();
    },

    estimatedStock: async (warehousingProvider, warehousingContext, unchainedAPI) => {
      const director = await WarehousingDirector.actions(
        warehousingProvider,
        warehousingContext,
        unchainedAPI,
      );
      return director.estimatedStock();
    },

    updateTokenOwnership: async ({ tokenId, userId, walletAddress }) => {
      const token = await TokenSurrogates.findOneAndUpdate(
        { _id: tokenId },
        {
          $set: {
            userId,
            walletAddress,
          },
        },
        { returnDocument: 'after' },
      );
      await emit('TOKEN_OWNERSHIP_CHANGED', { token });
    },

    tokenizeItems: async (order, { items }, unchainedAPI) => {
      const virtualProviders = await WarehousingProviders.find(
        buildFindSelector({ type: WarehousingProviderType.VIRTUAL }),
      ).toArray();

      const tokenizers = await Promise.all(
        items.flatMap(({ orderPosition, product }) => {
          const warehousingContext: WarehousingContext = {
            order,
            orderPosition,
            product,
            quantity: orderPosition.quantity,
            referenceDate: order.ordered,
          };
          return virtualProviders.map(async (provider) => {
            const director = await WarehousingDirector.actions(
              provider,
              warehousingContext,
              unchainedAPI,
            );
            const isActive = await director.isActive();
            if (isActive) return director.tokenize;
            return (async () => []) as typeof director.tokenize;
          });
        }),
      );

      // Tokenize linearly so that after every tokenized item, the db is updated
      await tokenizers.reduce(async (lastPromise, tokenizer) => {
        await lastPromise;
        const tokenSurrogates = await tokenizer();
        await TokenSurrogates.insertMany(tokenSurrogates);
        return true;
      }, Promise.resolve(false));
    },

    tokenMetadata: async (chainTokenId, { token, product, locale, referenceDate }, unchainedAPI) => {
      const virtualProviders = await WarehousingProviders.find(
        buildFindSelector({ type: WarehousingProviderType.VIRTUAL }),
      ).toArray();

      const warehousingContext: WarehousingContext = {
        product,
        token,
        locale,
        quantity: token?.quantity || 1,
        referenceDate,
      };
      return virtualProviders.reduce(async (lastPromise, provider) => {
        const last = await lastPromise;
        if (last) return last;
        const currentDirector = await WarehousingDirector.actions(
          provider,
          warehousingContext,
          unchainedAPI,
        );
        const isActive = await currentDirector.isActive();
        if (isActive) {
          return currentDirector.tokenMetadata(chainTokenId);
        }
        return null;
      }, Promise.resolve(null));
    },

    isInvalidateable: async (chainTokenId, { token, product, referenceDate }, unchainedAPI) => {
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
          unchainedAPI,
        );
        const isActive = await currentDirector.isActive();
        if (isActive) {
          return currentDirector.isInvalidateable(chainTokenId);
        }
        return null;
      }, Promise.resolve(null));
    },

    invalidateToken: async (tokenId) => {
      const token = await TokenSurrogates.findOneAndUpdate(
        { _id: tokenId, invalidatedDate: null },
        {
          $set: {
            invalidatedDate: new Date(),
          },
        },
        {
          returnDocument: 'after',
        },
      );
      if (token) {
        await emit('TOKEN_INVALIDATED', { token });
      }
    },

    buildAccessKeyForToken: async (tokenId) => {
      const token = await TokenSurrogates.findOne(generateDbFilterById(tokenId));
      const payload = [
        token._id,
        token.walletAddress || token.userId,
        process.env.UNCHAINED_SECRET,
      ].join('');
      const msgUint8 = new TextEncoder().encode(payload);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

      return hashHex;
    },

    isActive: async (warehousingProvider, unchainedAPI) => {
      const actions = await WarehousingDirector.actions(warehousingProvider, {}, unchainedAPI);
      return actions.isActive();
    },

    // Mutations
    create: async (doc) => {
      const Adapter = WarehousingDirector.getAdapter(doc.adapterKey);
      if (!Adapter) return null;

      const warehousingProviderId = await mutations.create({
        configuration: Adapter.initialConfiguration,
        ...doc,
      });

      const warehousingProvider = await WarehousingProviders.findOne(
        generateDbFilterById(warehousingProviderId),
      );
      await emit('WAREHOUSING_PROVIDER_CREATE', { warehousingProvider });
      return warehousingProviderId;
    },

    update: async (_id: string, doc: WarehousingProvider) => {
      const warehousingProviderId = await mutations.update(_id, doc);
      const warehousingProvider = await WarehousingProviders.findOne(generateDbFilterById(_id), {});

      if (!warehousingProvider) return null;

      await emit('WAREHOUSING_PROVIDER_UPDATE', { warehousingProvider });
      return warehousingProviderId;
    },

    delete: async (providerId) => {
      await mutations.delete(providerId);
      const warehousingProvider = await WarehousingProviders.findOne(
        generateDbFilterById(providerId),
        {},
      );

      await emit('WAREHOUSING_PROVIDER_REMOVE', { warehousingProvider });

      return warehousingProvider;
    },
  };
};
