import { emit, registerEvents } from '@unchainedshop/events';
import {
  eq,
  and,
  or,
  isNull,
  isNotNull,
  inArray,
  like,
  sql,
  asc,
  generateId,
  buildSelectColumns,
  type SQL,
  type DrizzleDb,
} from '@unchainedshop/store';
import { paymentProviders, type PaymentProviderRow, type PaymentProviderType } from '../db/schema.ts';
import pMemoize from 'p-memoize';
import ExpiryMap from 'expiry-map';

export type PaymentConfiguration = {
  key: string;
  value: string | null;
}[];

export interface PaymentProvider {
  _id: string;
  type: PaymentProviderType;
  adapterKey: string;
  configuration: PaymentConfiguration;
  created: Date;
  updated?: Date;
  deleted?: Date | null;
}

export interface PaymentInterface {
  _id: string;
  label: string;
  version: string;
}

const PAYMENT_PROVIDER_EVENTS: string[] = [
  'PAYMENT_PROVIDER_CREATE',
  'PAYMENT_PROVIDER_UPDATE',
  'PAYMENT_PROVIDER_REMOVE',
];

const allProvidersCache = new ExpiryMap(process.env.NODE_ENV === 'production' ? 60000 : 1);

export interface PaymentProviderQuery {
  paymentProviderIds?: string[];
  type?: PaymentProviderType;
  includeDeleted?: boolean;
  queryString?: string;
}

export type PaymentProviderFields = keyof PaymentProvider;

export interface PaymentProviderQueryOptions {
  fields?: PaymentProviderFields[];
}

const COLUMNS = {
  _id: paymentProviders._id,
  type: paymentProviders.type,
  adapterKey: paymentProviders.adapterKey,
  configuration: paymentProviders.configuration,
  created: paymentProviders.created,
  updated: paymentProviders.updated,
  deleted: paymentProviders.deleted,
} as const;

const rowToPaymentProvider = (row: PaymentProviderRow): PaymentProvider => ({
  _id: row._id,
  type: row.type as PaymentProviderType,
  adapterKey: row.adapterKey,
  configuration: row.configuration ?? [],
  created: row.created,
  updated: row.updated ?? undefined,
  deleted: row.deleted ?? null,
});

export const configurePaymentProvidersModule = (db: DrizzleDb) => {
  registerEvents(PAYMENT_PROVIDER_EVENTS);

  const buildConditions = async (query: PaymentProviderQuery): Promise<SQL[]> => {
    const conditions: SQL[] = [];

    if (!query.includeDeleted) {
      conditions.push(isNull(paymentProviders.deleted));
    }

    if (query.paymentProviderIds?.length) {
      conditions.push(inArray(paymentProviders._id, query.paymentProviderIds));
    }

    if (query.type) {
      conditions.push(eq(paymentProviders.type, query.type));
    }

    if (query.queryString) {
      const pattern = `%${query.queryString}%`;
      conditions.push(
        or(like(paymentProviders._id, pattern), like(paymentProviders.adapterKey, pattern))!,
      );
    }

    return conditions;
  };

  return {
    // Queries
    count: async (query: PaymentProviderQuery = {}): Promise<number> => {
      const conditions = await buildConditions(query);
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(paymentProviders)
        .where(whereClause);
      return count ?? 0;
    },

    findProvider: async (
      { paymentProviderId }: { paymentProviderId: string },
      options?: PaymentProviderQueryOptions,
    ) => {
      const selectColumns = buildSelectColumns(COLUMNS, options?.fields);
      const baseQuery = selectColumns
        ? db.select(selectColumns).from(paymentProviders)
        : db.select().from(paymentProviders);
      const [row] = await baseQuery.where(eq(paymentProviders._id, paymentProviderId)).limit(1);
      return row
        ? selectColumns
          ? (row as unknown as PaymentProvider)
          : rowToPaymentProvider(row as PaymentProviderRow)
        : null;
    },

    findProviders: async (
      query: PaymentProviderQuery = {},
      options?: PaymentProviderQueryOptions,
    ): Promise<PaymentProvider[]> => {
      const conditions = await buildConditions(query);
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const selectColumns = buildSelectColumns(COLUMNS, options?.fields);
      const baseQuery = selectColumns
        ? db.select(selectColumns).from(paymentProviders)
        : db.select().from(paymentProviders);
      const results = await baseQuery.where(whereClause).orderBy(asc(paymentProviders.created));
      return selectColumns
        ? (results as unknown as PaymentProvider[])
        : results.map((r) => rowToPaymentProvider(r as PaymentProviderRow));
    },

    allProviders: pMemoize(
      async function () {
        const results = await db
          .select()
          .from(paymentProviders)
          .where(isNull(paymentProviders.deleted))
          .orderBy(asc(paymentProviders.created));
        return results.map(rowToPaymentProvider);
      },
      {
        cache: allProvidersCache,
      },
    ),

    providerExists: async ({ paymentProviderId }: { paymentProviderId: string }): Promise<boolean> => {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(paymentProviders)
        .where(and(eq(paymentProviders._id, paymentProviderId), isNull(paymentProviders.deleted)))
        .limit(1);
      return (count ?? 0) > 0;
    },

    // Mutations
    create: async (
      doc: Omit<PaymentProvider, '_id' | 'created'> & Pick<Partial<PaymentProvider>, '_id' | 'created'>,
    ): Promise<PaymentProvider> => {
      const paymentProviderId = doc._id || generateId();
      const now = doc.created || new Date();

      // Clean up any soft-deleted providers with same ID
      await db
        .delete(paymentProviders)
        .where(and(eq(paymentProviders._id, paymentProviderId), isNotNull(paymentProviders.deleted)));

      await db.insert(paymentProviders).values({
        _id: paymentProviderId,
        type: doc.type,
        adapterKey: doc.adapterKey,
        configuration: doc.configuration ?? null,
        created: now,
        deleted: null,
      });

      const [row] = await db
        .select()
        .from(paymentProviders)
        .where(eq(paymentProviders._id, paymentProviderId))
        .limit(1);

      const paymentProvider = rowToPaymentProvider(row!);
      allProvidersCache.clear();
      await emit('PAYMENT_PROVIDER_CREATE', { paymentProvider });
      return paymentProvider;
    },

    update: async (_id: string, doc: Partial<PaymentProvider>) => {
      const updateData: Record<string, any> = {
        updated: new Date(),
      };

      if (doc.type !== undefined) updateData.type = doc.type;
      if (doc.adapterKey !== undefined) updateData.adapterKey = doc.adapterKey;
      if (doc.configuration !== undefined) updateData.configuration = doc.configuration;

      await db.update(paymentProviders).set(updateData).where(eq(paymentProviders._id, _id));

      const [row] = await db
        .select()
        .from(paymentProviders)
        .where(eq(paymentProviders._id, _id))
        .limit(1);

      if (!row) return null;
      const paymentProvider = rowToPaymentProvider(row);
      allProvidersCache.clear();
      await emit('PAYMENT_PROVIDER_UPDATE', { paymentProvider });
      return paymentProvider;
    },

    delete: async (_id: string) => {
      await db
        .update(paymentProviders)
        .set({ deleted: new Date() })
        .where(eq(paymentProviders._id, _id));

      const [row] = await db
        .select()
        .from(paymentProviders)
        .where(eq(paymentProviders._id, _id))
        .limit(1);

      if (!row) return null;
      const paymentProvider = rowToPaymentProvider(row);
      allProvidersCache.clear();
      await emit('PAYMENT_PROVIDER_REMOVE', { paymentProvider });
      return paymentProvider;
    },
  };
};

export type PaymentProvidersModule = ReturnType<typeof configurePaymentProvidersModule>;
