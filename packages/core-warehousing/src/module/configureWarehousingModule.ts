import { emit, registerEvents } from '@unchainedshop/events';
import { generateDbFilterById, type mongodb, assertDocumentDBCompatMode } from '@unchainedshop/mongodb';
import type { IStore } from '@unchainedshop/store';
import { type TokenSurrogate, TokenSurrogateCollection } from '../db/TokenSurrogateCollection.ts';
import { configureWarehousingProvidersModule } from './configureWarehousingProvidersModule.ts';

interface TokenQuery {
  queryString?: string;
  userId?: string;
  walletAddressExists?: boolean;
}

const TOKEN_EVENTS: string[] = ['TOKEN_OWNERSHIP_CHANGED', 'TOKEN_INVALIDATED'];

export interface WarehousingModuleInput {
  db: mongodb.Db; // For tokens (MongoDB)
  store: IStore; // For providers (Store)
}

export const buildTokenFindSelector = ({ queryString, walletAddressExists, ...rest }: TokenQuery) => {
  const selector: mongodb.Filter<TokenSurrogate> = { ...(rest || {}) };
  if (queryString) {
    assertDocumentDBCompatMode();
    (selector as any).$text = { $search: queryString };
  }
  if (walletAddressExists !== undefined) {
    selector.walletAddress = walletAddressExists ? { $exists: true } : { $exists: false };
  }

  return selector;
};

export const configureWarehousingModule = async ({ db, store }: WarehousingModuleInput) => {
  registerEvents(TOKEN_EVENTS);

  const TokenSurrogates = await TokenSurrogateCollection(db);
  const warehousingProviders = configureWarehousingProvidersModule(store);

  // Create a combined module that exposes both provider and token operations
  return {
    // Provider operations (delegated to store-based module)
    ...warehousingProviders,

    // Token operations (remain on MongoDB)
    createTokens: async (tokens: TokenSurrogate[]): Promise<void> => {
      await TokenSurrogates.insertMany(tokens);
    },

    findToken: async ({ tokenId }: { tokenId: string }, options?: mongodb.FindOptions) => {
      return TokenSurrogates.findOne({ _id: tokenId }, options);
    },

    findTokens: async (selector: any, options?: mongodb.FindOptions): Promise<TokenSurrogate[]> => {
      return TokenSurrogates.find(buildTokenFindSelector(selector), options).toArray();
    },

    tokensCount: async (selector: any = {}): Promise<number> => {
      const tokenCount = await TokenSurrogates.countDocuments(buildTokenFindSelector(selector));
      return tokenCount;
    },

    findTokensForUser: async (
      params: { userId: string } | { walletAddresses: string[] },
      options?: mongodb.FindOptions,
    ): Promise<TokenSurrogate[]> => {
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

    updateTokenOwnership: async (
      params:
        | {
            tokenId: string;
            userId: string;
          }
        | {
            tokenId: string;
            walletAddress: string;
          },
    ) => {
      const modifier: mongodb.UpdateFilter<TokenSurrogate> =
        'userId' in params
          ? {
              $set: {
                userId: params.userId,
              },
              $unset: {
                walletAddress: 1,
              },
            }
          : {
              $set: {
                walletAddress: params.walletAddress,
              },
              $unset: {
                userId: 1,
              },
            };
      const token = await TokenSurrogates.findOneAndUpdate({ _id: params.tokenId }, modifier, {
        returnDocument: 'after',
      });
      if (!token) return null;
      await emit('TOKEN_OWNERSHIP_CHANGED', { token });
      return token;
    },

    invalidateToken: async (tokenId: string) => {
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
      if (!token) return null;
      await emit('TOKEN_INVALIDATED', { token });
      return token;
    },

    buildAccessKeyForToken: async (tokenId: string): Promise<string | null> => {
      const token = await TokenSurrogates.findOne(generateDbFilterById(tokenId));
      if (!token) return null;

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
  };
};

export type WarehousingModule = Awaited<ReturnType<typeof configureWarehousingModule>>;
