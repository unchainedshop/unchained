import { emit, registerEvents } from '@unchainedshop/events';
import {
  eq,
  and,
  isNull,
  isNotNull,
  inArray,
  sql,
  asc,
  generateId,
  buildSelectColumns,
  type SQL,
  type DrizzleDb,
} from '@unchainedshop/store';
import { deliveryProviders, type DeliveryProviderRow, type DeliveryProviderType } from '../db/schema.ts';
import { deliverySettings, type DeliverySettingsOptions } from '../delivery-settings.ts';
import pMemoize from 'p-memoize';
import ExpiryMap from 'expiry-map';

export type DeliveryConfiguration = {
  key: string;
  value: string;
}[];

export interface DeliveryProvider {
  _id: string;
  type: DeliveryProviderType;
  adapterKey: string;
  configuration: DeliveryConfiguration;
  created: Date;
  updated?: Date;
  deleted?: Date | null;
}

export interface DeliveryLocation {
  _id: string;
  name: string;
  address: {
    addressLine: string;
    addressLine2?: string;
    postalCode: string;
    countryCode: string;
    city: string;
  };
  geoPoint: {
    latitude: number;
    longitude: number;
  };
}

const DELIVERY_PROVIDER_EVENTS: string[] = [
  'DELIVERY_PROVIDER_CREATE',
  'DELIVERY_PROVIDER_UPDATE',
  'DELIVERY_PROVIDER_REMOVE',
];

export interface DeliveryInterface {
  _id: string;
  label: string;
  version: string;
}

export interface DeliveryProviderQuery {
  deliveryProviderIds?: string[];
  searchDeliveryProviderIds?: string[];
  type?: DeliveryProviderType;
  includeDeleted?: boolean;
}

export type DeliveryProviderFields = keyof DeliveryProvider;

export interface DeliveryProviderQueryOptions {
  fields?: DeliveryProviderFields[];
}

const COLUMNS = {
  _id: deliveryProviders._id,
  type: deliveryProviders.type,
  adapterKey: deliveryProviders.adapterKey,
  configuration: deliveryProviders.configuration,
  created: deliveryProviders.created,
  updated: deliveryProviders.updated,
  deleted: deliveryProviders.deleted,
} as const;

const rowToDeliveryProvider = (row: DeliveryProviderRow): DeliveryProvider => ({
  _id: row._id,
  type: row.type as DeliveryProviderType,
  adapterKey: row.adapterKey,
  configuration: row.configuration ?? [],
  created: row.created,
  updated: row.updated ?? undefined,
  deleted: row.deleted ?? null,
});

const allProvidersCache = new ExpiryMap(process.env.NODE_ENV === 'production' ? 60000 : 1);

export const configureDeliveryModule = async ({
  db,
  options: deliveryOptions = {},
}: {
  db: DrizzleDb;
  options?: DeliverySettingsOptions;
}) => {
  registerEvents(DELIVERY_PROVIDER_EVENTS);

  deliverySettings.configureSettings(deliveryOptions);

  const buildConditions = async (query: DeliveryProviderQuery): Promise<SQL[]> => {
    const conditions: SQL[] = [];

    if (!query.includeDeleted) {
      conditions.push(isNull(deliveryProviders.deleted));
    }

    if (query.deliveryProviderIds?.length) {
      conditions.push(inArray(deliveryProviders._id, query.deliveryProviderIds));
    }

    if (query.type) {
      conditions.push(eq(deliveryProviders.type, query.type));
    }

    if (query.searchDeliveryProviderIds?.length) {
      conditions.push(inArray(deliveryProviders._id, query.searchDeliveryProviderIds));
    }

    return conditions;
  };

  return {
    // Queries
    count: async (query: DeliveryProviderQuery = {}): Promise<number> => {
      const conditions = await buildConditions(query);
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(deliveryProviders)
        .where(whereClause);
      return count ?? 0;
    },

    findProvider: async (
      { deliveryProviderId }: { deliveryProviderId: string },
      options?: DeliveryProviderQueryOptions,
    ) => {
      const selectColumns = buildSelectColumns(COLUMNS, options?.fields);
      const baseQuery = selectColumns
        ? db.select(selectColumns).from(deliveryProviders)
        : db.select().from(deliveryProviders);
      const [row] = await baseQuery.where(eq(deliveryProviders._id, deliveryProviderId)).limit(1);
      return row
        ? selectColumns
          ? (row as unknown as DeliveryProvider)
          : rowToDeliveryProvider(row as DeliveryProviderRow)
        : null;
    },

    findProviders: async (
      query: DeliveryProviderQuery = {},
      options?: DeliveryProviderQueryOptions,
    ): Promise<DeliveryProvider[]> => {
      const conditions = await buildConditions(query);
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const selectColumns = buildSelectColumns(COLUMNS, options?.fields);
      const baseQuery = selectColumns
        ? db.select(selectColumns).from(deliveryProviders)
        : db.select().from(deliveryProviders);
      const results = await baseQuery.where(whereClause).orderBy(asc(deliveryProviders.created));
      return selectColumns
        ? (results as unknown as DeliveryProvider[])
        : results.map((r) => rowToDeliveryProvider(r as DeliveryProviderRow));
    },

    allProviders: pMemoize(
      async function () {
        const results = await db
          .select()
          .from(deliveryProviders)
          .where(isNull(deliveryProviders.deleted))
          .orderBy(asc(deliveryProviders.created));
        return results.map(rowToDeliveryProvider);
      },
      {
        cache: allProvidersCache,
      },
    ),

    providerExists: async ({ deliveryProviderId }: { deliveryProviderId: string }): Promise<boolean> => {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(deliveryProviders)
        .where(and(eq(deliveryProviders._id, deliveryProviderId), isNull(deliveryProviders.deleted)))
        .limit(1);
      return (count ?? 0) > 0;
    },

    // Mutations
    create: async (
      doc: Omit<DeliveryProvider, '_id' | 'created'> & Pick<Partial<DeliveryProvider>, '_id'>,
    ) => {
      const deliveryProviderId = doc._id || generateId();
      const now = new Date();

      // Clean up any soft-deleted providers with same ID
      await db
        .delete(deliveryProviders)
        .where(and(eq(deliveryProviders._id, deliveryProviderId), isNotNull(deliveryProviders.deleted)));

      await db.insert(deliveryProviders).values({
        _id: deliveryProviderId,
        type: doc.type,
        adapterKey: doc.adapterKey,
        configuration: doc.configuration ?? null,
        created: now,
        deleted: null,
      });

      const [row] = await db
        .select()
        .from(deliveryProviders)
        .where(eq(deliveryProviders._id, deliveryProviderId))
        .limit(1);

      const deliveryProvider = rowToDeliveryProvider(row!);
      allProvidersCache.clear();
      await emit('DELIVERY_PROVIDER_CREATE', { deliveryProvider });
      return deliveryProvider;
    },

    update: async (_id: string, doc: Partial<DeliveryProvider>) => {
      const updateData: Record<string, any> = {
        updated: new Date(),
      };

      if (doc.type !== undefined) updateData.type = doc.type;
      if (doc.adapterKey !== undefined) updateData.adapterKey = doc.adapterKey;
      if (doc.configuration !== undefined) updateData.configuration = doc.configuration;

      await db.update(deliveryProviders).set(updateData).where(eq(deliveryProviders._id, _id));

      const [row] = await db
        .select()
        .from(deliveryProviders)
        .where(eq(deliveryProviders._id, _id))
        .limit(1);

      if (!row) return null;
      const deliveryProvider = rowToDeliveryProvider(row);
      allProvidersCache.clear();
      await emit('DELIVERY_PROVIDER_UPDATE', { deliveryProvider });
      return deliveryProvider;
    },

    delete: async (_id: string) => {
      await db
        .update(deliveryProviders)
        .set({ deleted: new Date() })
        .where(eq(deliveryProviders._id, _id));

      const [row] = await db
        .select()
        .from(deliveryProviders)
        .where(eq(deliveryProviders._id, _id))
        .limit(1);

      if (!row) return null;
      const deliveryProvider = rowToDeliveryProvider(row);
      allProvidersCache.clear();
      await emit('DELIVERY_PROVIDER_REMOVE', { deliveryProvider });
      return deliveryProvider;
    },
  };
};

export type DeliveryModule = Awaited<ReturnType<typeof configureDeliveryModule>>;
