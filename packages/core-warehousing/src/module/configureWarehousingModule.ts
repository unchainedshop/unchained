import { emit, registerEvents } from '@unchainedshop/events';
import { generateDbFilterById, generateDbObjectId, mongodb, ModuleInput } from '@unchainedshop/mongodb';
import {
  WarehousingProvider,
  WarehousingProvidersCollection,
  WarehousingProviderType,
} from '../db/WarehousingProvidersCollection.js';
import { TokenSurrogate, TokenSurrogateCollection } from '../db/TokenSurrogateCollection.js';

type WarehousingProviderQuery = {
  type?: WarehousingProviderType;
};

type TokenQuery = {
  queryString?: string;
  userId?: string;
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
export const buildTokenFindSelector = ({ queryString, ...rest }: TokenQuery) => {
  const selector: mongodb.Filter<TokenSurrogate> = { ...(rest || {}) };
  if (queryString) {
    (selector as any).$text = { $search: queryString };
  }

  return selector;
};

export const configureWarehousingModule = async ({ db }: ModuleInput<Record<string, never>>) => {
  registerEvents(WAREHOUSING_PROVIDER_EVENTS);

  const WarehousingProviders = await WarehousingProvidersCollection(db);
  const TokenSurrogates = await TokenSurrogateCollection(db);

  return {
    // Queries
    count: async (query: WarehousingProviderQuery): Promise<number> => {
      const providerCount = await WarehousingProviders.countDocuments(buildFindSelector(query));
      return providerCount;
    },

    createTokens: async (tokens: TokenSurrogate[]): Promise<void> => {
      await TokenSurrogates.insertMany(tokens);
    },

    findProvider: async (
      { warehousingProviderId }: { warehousingProviderId: string },
      options?: mongodb.FindOptions,
    ): Promise<WarehousingProvider> => {
      return WarehousingProviders.findOne(generateDbFilterById(warehousingProviderId), options);
    },

    findToken: async (
      { tokenId }: { tokenId: string },
      options?: mongodb.FindOptions,
    ): Promise<TokenSurrogate> => {
      return TokenSurrogates.findOne({ _id: tokenId }, options);
    },

    findTokens: async (selector: any, options?: mongodb.FindOptions): Promise<Array<TokenSurrogate>> => {
      return TokenSurrogates.find(buildTokenFindSelector(selector), options).toArray();
    },

    tokensCount: async (selector: any = {}): Promise<number> => {
      const tokenCount = await TokenSurrogates.countDocuments(buildTokenFindSelector(selector));
      return tokenCount;
    },

    findTokensForUser: async (
      params: { userId: string } | { walletAddresses: string[] },
      options?: mongodb.FindOptions,
    ): Promise<Array<TokenSurrogate>> => {
      const { userId, walletAddresses } = params as any;
      if (!userId && !walletAddresses)
        throw new Error('userId or walletAddresses must be provided for findTokensForUser');
      const selector = {
        $or: [
          walletAddresses && {
            walletAddress: { $in: walletAddresses || [] },
          },
          userId && {
            userId,
          },
        ].filter(Boolean),
      };

      const userTokens = await TokenSurrogates.find(selector, options).toArray();
      return userTokens;
    },

    findProviders: async (
      query: WarehousingProviderQuery,
      options: mongodb.FindOptions = { sort: { created: 1 } },
    ): Promise<Array<WarehousingProvider>> => {
      const providers = WarehousingProviders.find(buildFindSelector(query), options);
      return providers.toArray();
    },

    providerExists: async ({
      warehousingProviderId,
    }: {
      warehousingProviderId: string;
    }): Promise<boolean> => {
      const providerCount = await WarehousingProviders.countDocuments(
        generateDbFilterById(warehousingProviderId, { deleted: null }),
        { limit: 1 },
      );
      return !!providerCount;
    },

    updateTokenOwnership: async ({
      tokenId,
      userId,
      walletAddress,
    }: {
      tokenId: string;
      userId: string;
      walletAddress: string;
    }): Promise<TokenSurrogate> => {
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
      return token;
    },

    invalidateToken: async (tokenId: string): Promise<TokenSurrogate> => {
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
      return token;
    },

    buildAccessKeyForToken: async (tokenId: string): Promise<string> => {
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
    create: async (doc: WarehousingProvider): Promise<WarehousingProvider> => {
      const { insertedId: warehousingProviderId } = await WarehousingProviders.insertOne({
        _id: generateDbObjectId(),
        created: new Date(),
        ...doc,
      });

      const warehousingProvider = await WarehousingProviders.findOne({ _id: warehousingProviderId });
      await emit('WAREHOUSING_PROVIDER_CREATE', { warehousingProvider });
      return warehousingProvider;
    },

    update: async (warehousingProviderId: string, doc: Partial<WarehousingProvider>) => {
      const warehousingProvider = await WarehousingProviders.findOneAndUpdate(
        { _id: warehousingProviderId },
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
      return warehousingProvider;
    },

    delete: async (providerId: string): Promise<WarehousingProvider> => {
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

export type WarehousingModule = Awaited<ReturnType<typeof configureWarehousingModule>>;
