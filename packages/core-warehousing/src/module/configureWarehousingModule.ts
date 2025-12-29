import { emit, registerEvents } from '@unchainedshop/events';
import {
  eq,
  and,
  or,
  isNull,
  isNotNull,
  inArray,
  sql,
  asc,
  generateId,
  type SQL,
  type DrizzleDb,
} from '@unchainedshop/store';
import {
  warehousingProviders,
  tokenSurrogates,
  type WarehousingProviderRow,
  type TokenSurrogateRow,
  type WarehousingProviderType,
} from '../db/schema.ts';
import { searchTokenSurrogatesFTS } from '../db/fts.ts';
import pMemoize from 'p-memoize';
import ExpiryMap from 'expiry-map';

export type WarehousingConfiguration = { key: string; value: string }[];

export interface WarehousingProvider {
  _id: string;
  type: WarehousingProviderType;
  adapterKey: string;
  configuration: WarehousingConfiguration;
  created: Date;
  updated?: Date;
  deleted?: Date | null;
}

export interface TokenSurrogate {
  _id: string;
  userId?: string;
  walletAddress?: string;
  invalidatedDate?: Date | null;
  expiryDate?: Date;
  quantity: number;
  contractAddress?: string;
  chainId?: string;
  tokenSerialNumber: string;
  productId: string;
  orderPositionId: string;
  meta: any;
}

export interface TokenQuery {
  queryString?: string;
  userId?: string;
  walletAddressExists?: boolean;
  tokenSerialNumber?: string;
  contractAddress?: string;
  orderPositionId?: string;
  productId?: string;
  // Support MongoDB-style meta queries like 'meta.cancelled': null
  [key: `meta.${string}`]: any;
}

const WAREHOUSING_PROVIDER_EVENTS: string[] = [
  'WAREHOUSING_PROVIDER_CREATE',
  'WAREHOUSING_PROVIDER_UPDATE',
  'WAREHOUSING_PROVIDER_REMOVE',
  'TOKEN_OWNERSHIP_CHANGED',
  'TOKEN_INVALIDATED',
];

const allProvidersCache = new ExpiryMap(process.env.NODE_ENV === 'production' ? 60000 : 1);

export interface WarehousingProviderQuery {
  warehousingProviderIds?: string[];
  type?: WarehousingProviderType;
  includeDeleted?: boolean;
  queryString?: string;
}

const rowToWarehousingProvider = (row: WarehousingProviderRow): WarehousingProvider => ({
  _id: row._id,
  type: row.type as WarehousingProviderType,
  adapterKey: row.adapterKey,
  configuration: row.configuration ? JSON.parse(row.configuration) : [],
  created: row.created,
  updated: row.updated ?? undefined,
  deleted: row.deleted ?? null,
});

const rowToTokenSurrogate = (row: TokenSurrogateRow): TokenSurrogate => ({
  _id: row._id,
  userId: row.userId ?? undefined,
  walletAddress: row.walletAddress ?? undefined,
  invalidatedDate: row.invalidatedDate ?? null,
  expiryDate: row.expiryDate ?? undefined,
  quantity: row.quantity,
  contractAddress: row.contractAddress ?? undefined,
  chainId: row.chainId ?? undefined,
  tokenSerialNumber: row.tokenSerialNumber,
  productId: row.productId,
  orderPositionId: row.orderPositionId,
  meta: row.meta ? JSON.parse(row.meta) : undefined,
});

export const configureWarehousingModule = async ({ db }: { db: DrizzleDb }) => {
  registerEvents(WAREHOUSING_PROVIDER_EVENTS);

  const buildProviderConditions = async (query: WarehousingProviderQuery): Promise<SQL[]> => {
    const conditions: SQL[] = [];

    if (!query.includeDeleted) {
      conditions.push(isNull(warehousingProviders.deleted));
    }

    if (query.warehousingProviderIds?.length) {
      conditions.push(inArray(warehousingProviders._id, query.warehousingProviderIds));
    }

    if (query.type) {
      conditions.push(eq(warehousingProviders.type, query.type));
    }

    if (query.queryString) {
      const pattern = `%${query.queryString}%`;
      conditions.push(
        or(
          sql`${warehousingProviders._id} LIKE ${pattern}`,
          sql`${warehousingProviders.adapterKey} LIKE ${pattern}`,
        )!,
      );
    }

    return conditions;
  };

  const buildTokenConditions = async (query: TokenQuery): Promise<SQL[]> => {
    const conditions: SQL[] = [];

    if (query.userId) {
      conditions.push(eq(tokenSurrogates.userId, query.userId));
    }

    if (query.walletAddressExists === true) {
      conditions.push(isNotNull(tokenSurrogates.walletAddress));
    } else if (query.walletAddressExists === false) {
      conditions.push(isNull(tokenSurrogates.walletAddress));
    }

    if (query.tokenSerialNumber) {
      conditions.push(eq(tokenSurrogates.tokenSerialNumber, query.tokenSerialNumber));
    }

    if (query.contractAddress) {
      conditions.push(eq(tokenSurrogates.contractAddress, query.contractAddress));
    }

    if (query.orderPositionId) {
      conditions.push(eq(tokenSurrogates.orderPositionId, query.orderPositionId));
    }

    if (query.productId) {
      conditions.push(eq(tokenSurrogates.productId, query.productId));
    }

    // Handle meta.* queries (MongoDB-style)
    for (const key of Object.keys(query)) {
      if (key.startsWith('meta.')) {
        const metaKey = key.substring(5); // Remove 'meta.' prefix
        const value = query[key as `meta.${string}`];
        if (value === null) {
          // Check for null value in JSON
          conditions.push(sql`json_extract(${tokenSurrogates.meta}, '$."${sql.raw(metaKey)}"') IS NULL`);
        } else {
          conditions.push(
            sql`json_extract(${tokenSurrogates.meta}, '$."${sql.raw(metaKey)}"') = ${JSON.stringify(value)}`,
          );
        }
      }
    }

    if (query.queryString) {
      const matchingIds = await searchTokenSurrogatesFTS(db, query.queryString);
      if (matchingIds.length === 0) {
        // No matches - return impossible condition
        conditions.push(sql`1 = 0`);
      } else {
        conditions.push(inArray(tokenSurrogates._id, matchingIds));
      }
    }

    return conditions;
  };

  return {
    // Queries
    count: async (query: WarehousingProviderQuery = {}): Promise<number> => {
      const conditions = await buildProviderConditions(query);
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(warehousingProviders)
        .where(whereClause);
      return count ?? 0;
    },

    createTokens: async (tokens: TokenSurrogate[]): Promise<void> => {
      if (tokens.length === 0) return;
      await db.insert(tokenSurrogates).values(
        tokens.map((token) => ({
          _id: token._id || generateId(),
          userId: token.userId,
          walletAddress: token.walletAddress,
          invalidatedDate: token.invalidatedDate,
          expiryDate: token.expiryDate,
          quantity: token.quantity,
          contractAddress: token.contractAddress,
          chainId: token.chainId,
          tokenSerialNumber: token.tokenSerialNumber,
          productId: token.productId,
          orderPositionId: token.orderPositionId,
          meta: token.meta ? JSON.stringify(token.meta) : null,
        })),
      );
    },

    findProvider: async ({ warehousingProviderId }: { warehousingProviderId: string }) => {
      const [row] = await db
        .select()
        .from(warehousingProviders)
        .where(eq(warehousingProviders._id, warehousingProviderId))
        .limit(1);
      return row ? rowToWarehousingProvider(row) : null;
    },

    findToken: async ({ tokenId }: { tokenId: string }) => {
      const [row] = await db
        .select()
        .from(tokenSurrogates)
        .where(eq(tokenSurrogates._id, tokenId))
        .limit(1);
      return row ? rowToTokenSurrogate(row) : null;
    },

    findTokens: async (
      selector: TokenQuery = {},
      options?: { limit?: number; skip?: number },
    ): Promise<TokenSurrogate[]> => {
      const conditions = await buildTokenConditions(selector);
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      let queryBuilder = db.select().from(tokenSurrogates).where(whereClause);
      if (options?.limit) {
        queryBuilder = queryBuilder.limit(options.limit) as typeof queryBuilder;
      }
      if (options?.skip) {
        queryBuilder = queryBuilder.offset(options.skip) as typeof queryBuilder;
      }
      const results = await queryBuilder;
      return results.map(rowToTokenSurrogate);
    },

    tokensCount: async (selector: TokenQuery = {}): Promise<number> => {
      const conditions = await buildTokenConditions(selector);
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(tokenSurrogates)
        .where(whereClause);
      return count ?? 0;
    },

    findTokensForUser: async (
      params: { userId: string } | { walletAddresses: string[] },
    ): Promise<TokenSurrogate[]> => {
      const { userId, walletAddresses } = params as any;
      if (!userId && !walletAddresses)
        throw new Error('userId or walletAddresses must be provided for findTokensForUser');

      const conditions: SQL[] = [];
      if (walletAddresses?.length && userId) {
        conditions.push(
          or(
            inArray(tokenSurrogates.walletAddress, walletAddresses),
            eq(tokenSurrogates.userId, userId),
          )!,
        );
      } else if (walletAddresses?.length) {
        conditions.push(inArray(tokenSurrogates.walletAddress, walletAddresses));
      } else if (userId) {
        conditions.push(eq(tokenSurrogates.userId, userId));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const results = await db.select().from(tokenSurrogates).where(whereClause);
      return results.map(rowToTokenSurrogate);
    },

    findProviders: async (query: WarehousingProviderQuery = {}): Promise<WarehousingProvider[]> => {
      const conditions = await buildProviderConditions(query);
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const results = await db
        .select()
        .from(warehousingProviders)
        .where(whereClause)
        .orderBy(asc(warehousingProviders.created));
      return results.map(rowToWarehousingProvider);
    },

    allProviders: pMemoize(
      async function () {
        const results = await db
          .select()
          .from(warehousingProviders)
          .where(isNull(warehousingProviders.deleted))
          .orderBy(asc(warehousingProviders.created));
        return results.map(rowToWarehousingProvider);
      },
      {
        cache: allProvidersCache,
      },
    ),

    providerExists: async ({
      warehousingProviderId,
    }: {
      warehousingProviderId: string;
    }): Promise<boolean> => {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(warehousingProviders)
        .where(
          and(eq(warehousingProviders._id, warehousingProviderId), isNull(warehousingProviders.deleted)),
        )
        .limit(1);
      return (count ?? 0) > 0;
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
      const updateData =
        'userId' in params
          ? { userId: params.userId, walletAddress: null }
          : { walletAddress: params.walletAddress, userId: null };

      await db.update(tokenSurrogates).set(updateData).where(eq(tokenSurrogates._id, params.tokenId));

      const [row] = await db
        .select()
        .from(tokenSurrogates)
        .where(eq(tokenSurrogates._id, params.tokenId))
        .limit(1);

      if (!row) return null;
      const token = rowToTokenSurrogate(row);
      await emit('TOKEN_OWNERSHIP_CHANGED', { token });
      return token;
    },

    invalidateToken: async (tokenId: string) => {
      const result = await db
        .update(tokenSurrogates)
        .set({ invalidatedDate: new Date() })
        .where(and(eq(tokenSurrogates._id, tokenId), isNull(tokenSurrogates.invalidatedDate)));

      if (result.rowsAffected === 0) return null;

      const [row] = await db
        .select()
        .from(tokenSurrogates)
        .where(eq(tokenSurrogates._id, tokenId))
        .limit(1);

      if (!row) return null;
      const token = rowToTokenSurrogate(row);
      await emit('TOKEN_INVALIDATED', { token });
      return token;
    },

    buildAccessKeyForToken: async (tokenId: string): Promise<string | null> => {
      const [row] = await db
        .select()
        .from(tokenSurrogates)
        .where(eq(tokenSurrogates._id, tokenId))
        .limit(1);

      if (!row) return null;
      const token = rowToTokenSurrogate(row);

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
    create: async (
      doc: Omit<WarehousingProvider, '_id' | 'created'> & Pick<Partial<WarehousingProvider>, '_id'>,
    ) => {
      const warehousingProviderId = doc._id || generateId();
      const now = new Date();

      // Clean up any soft-deleted providers with same ID
      await db
        .delete(warehousingProviders)
        .where(
          and(
            eq(warehousingProviders._id, warehousingProviderId),
            isNotNull(warehousingProviders.deleted),
          ),
        );

      await db.insert(warehousingProviders).values({
        _id: warehousingProviderId,
        type: doc.type,
        adapterKey: doc.adapterKey,
        configuration: doc.configuration ? JSON.stringify(doc.configuration) : null,
        created: now,
        deleted: null,
      });

      const [row] = await db
        .select()
        .from(warehousingProviders)
        .where(eq(warehousingProviders._id, warehousingProviderId))
        .limit(1);

      const warehousingProvider = rowToWarehousingProvider(row!);
      allProvidersCache.clear();
      await emit('WAREHOUSING_PROVIDER_CREATE', { warehousingProvider });
      return warehousingProvider;
    },

    update: async (warehousingProviderId: string, doc: Partial<WarehousingProvider>) => {
      const updateData: Record<string, any> = {
        updated: new Date(),
      };

      if (doc.type !== undefined) updateData.type = doc.type;
      if (doc.adapterKey !== undefined) updateData.adapterKey = doc.adapterKey;
      if (doc.configuration !== undefined) updateData.configuration = JSON.stringify(doc.configuration);

      await db
        .update(warehousingProviders)
        .set(updateData)
        .where(eq(warehousingProviders._id, warehousingProviderId));

      const [row] = await db
        .select()
        .from(warehousingProviders)
        .where(eq(warehousingProviders._id, warehousingProviderId))
        .limit(1);

      if (!row) return null;
      const warehousingProvider = rowToWarehousingProvider(row);
      allProvidersCache.clear();
      await emit('WAREHOUSING_PROVIDER_UPDATE', { warehousingProvider });
      return warehousingProvider;
    },

    delete: async (providerId: string) => {
      await db
        .update(warehousingProviders)
        .set({ deleted: new Date() })
        .where(eq(warehousingProviders._id, providerId));

      const [row] = await db
        .select()
        .from(warehousingProviders)
        .where(eq(warehousingProviders._id, providerId))
        .limit(1);

      if (!row) return null;
      const warehousingProvider = rowToWarehousingProvider(row);
      allProvidersCache.clear();
      await emit('WAREHOUSING_PROVIDER_REMOVE', { warehousingProvider });
      return warehousingProvider;
    },
  };
};

export type WarehousingModule = Awaited<ReturnType<typeof configureWarehousingModule>>;
