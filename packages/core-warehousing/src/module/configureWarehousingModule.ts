import { emit, registerEvents } from '@unchainedshop/events';
import { generateDbFilterById, generateDbObjectId, mongodb, ModuleInput } from '@unchainedshop/mongodb';
import {
  WarehousingProvider,
  WarehousingProvidersCollection,
  WarehousingProviderType,
} from '../db/WarehousingProvidersCollection.js';
import {
  EstimatedDispatch,
  EstimatedStock,
  WarehousingDirector,
} from '../director/WarehousingDirector.js';
import { TokenSurrogate, TokenSurrogateCollection } from '../db/TokenSurrogateCollection.js';
import { WarehousingContext } from '../director/WarehousingAdapter.js';
import type { Product } from '@unchainedshop/core-products';
import type { User } from '@unchainedshop/core-users';

type WarehousingProviderQuery = {
  type?: WarehousingProviderType;
};

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

  estimatedDispatch: (
    provider: WarehousingProvider,
    context: WarehousingContext,
    unchainedAPI,
  ) => Promise<EstimatedDispatch>;

  estimatedStock: (
    provider: WarehousingProvider,
    context: WarehousingContext,
    unchainedAPI,
  ) => Promise<EstimatedStock>;

  updateTokenOwnership: (input: {
    tokenId: string;
    userId: string;
    walletAddress: string;
  }) => Promise<void>;

  invalidateToken: (tokenId: string) => Promise<void>;

  buildAccessKeyForToken: (tokenId: string) => Promise<string>;

  isInvalidateable: (
    chainTokenId: string,
    params: { product: Product; token: TokenSurrogate; referenceDate: Date },
    unchainedAPI,
  ) => Promise<boolean>;

  // Mutations
  delete: (providerId: string) => Promise<WarehousingProvider>;
  update: (_id: string, doc: WarehousingProvider) => Promise<string>;
  create: (doc: WarehousingProvider) => Promise<string | null>;

  createTokens: (tokens: TokenSurrogate[]) => Promise<void>;
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

export const configureWarehousingModule = async ({
  db,
}: ModuleInput<Record<string, never>>): Promise<WarehousingModule> => {
  registerEvents(WAREHOUSING_PROVIDER_EVENTS);

  const WarehousingProviders = await WarehousingProvidersCollection(db);
  const TokenSurrogates = await TokenSurrogateCollection(db);

  return {
    // Queries
    count: async (query) => {
      const providerCount = await WarehousingProviders.countDocuments(buildFindSelector(query));
      return providerCount;
    },

    createTokens: async (tokens: TokenSurrogate[]) => {
      await TokenSurrogates.insertMany(tokens);
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

    // Mutations
    create: async (doc) => {
      const Adapter = WarehousingDirector.getAdapter(doc.adapterKey);
      if (!Adapter) return null;

      const { insertedId: warehousingProviderId } = await WarehousingProviders.insertOne({
        _id: generateDbObjectId(),
        created: new Date(),
        configuration: Adapter.initialConfiguration,
        ...doc,
      });

      const warehousingProvider = await WarehousingProviders.findOne(
        generateDbFilterById(warehousingProviderId),
      );
      await emit('WAREHOUSING_PROVIDER_CREATE', { warehousingProvider });
      return warehousingProviderId;
    },

    update: async (warehousingProviderId: string, doc: WarehousingProvider) => {
      const warehousingProvider = await WarehousingProviders.findOneAndUpdate(
        generateDbFilterById(warehousingProviderId),
        {
          $set: {
            updated: new Date(),
            ...doc,
          },
        },
        { returnDocument: 'after' },
      );

      if (!warehousingProvider) return null;

      await emit('WAREHOUSING_PROVIDER_UPDATE', { warehousingProvider });
      return warehousingProviderId;
    },

    delete: async (providerId) => {
      const warehousingProvider = await WarehousingProviders.findOneAndUpdate(
        generateDbFilterById(providerId),
        {
          $set: {
            deleted: new Date(),
          },
        },
        { returnDocument: 'after' },
      );

      await emit('WAREHOUSING_PROVIDER_REMOVE', { warehousingProvider });

      return warehousingProvider;
    },
  };
};
