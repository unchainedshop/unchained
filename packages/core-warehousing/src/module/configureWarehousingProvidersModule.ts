/**
 * Isomorphic Warehousing Providers Module
 *
 * This module works in both browser and Node.js environments.
 * It uses the @unchainedshop/store abstraction for storage.
 */

import { emit, registerEvents } from '@unchainedshop/events';
import {
  generateId,
  type Entity,
  type TimestampFields,
  type SortOption,
  type IStore,
  type FilterQuery,
  type FindOptions,
  type TableSchema,
} from '@unchainedshop/store';
import pMemoize from 'p-memoize';
import ExpiryMap from 'expiry-map';

/**
 * Warehousing providers table schema for Turso/SQLite.
 */
export const warehousingProvidersSchema: TableSchema = {
  columns: [
    { name: '_id', type: 'TEXT', primaryKey: true },
    { name: 'type', type: 'TEXT', notNull: true },
    { name: 'adapterKey', type: 'TEXT', notNull: true },
    { name: 'configuration', type: 'TEXT' }, // JSON stringified
    { name: 'created', type: 'INTEGER', notNull: true },
    { name: 'updated', type: 'INTEGER' },
    { name: 'deleted', type: 'INTEGER' },
  ],
  indexes: [
    { name: 'idx_warehousing_type', columns: ['type'] },
    { name: 'idx_warehousing_created', columns: ['created'] },
    { name: 'idx_warehousing_deleted', columns: ['deleted'] },
  ],
};

/**
 * Warehousing provider type enum.
 */
export const WarehousingProviderType = {
  PHYSICAL: 'PHYSICAL',
  VIRTUAL: 'VIRTUAL',
} as const;

export type WarehousingProviderType =
  (typeof WarehousingProviderType)[keyof typeof WarehousingProviderType];

/**
 * Configuration key-value pairs for warehousing providers.
 */
export type WarehousingConfiguration = {
  key: string;
  value: string;
}[];

/**
 * Warehousing provider entity.
 */
export interface WarehousingProvider extends Entity, TimestampFields {
  _id: string;
  type: WarehousingProviderType;
  adapterKey: string;
  configuration: WarehousingConfiguration;
}

/**
 * Warehousing interface for adapter registration.
 */
export interface WarehousingInterface {
  _id: string;
  label: string;
  version: string;
}

/**
 * Query parameters for finding warehousing providers.
 */
export interface WarehousingProviderQuery {
  warehousingProviderIds?: string[];
  type?: WarehousingProviderType;
  includeDeleted?: boolean;
  queryString?: string;
  limit?: number;
  offset?: number;
  sort?: SortOption[];
}

/**
 * Events emitted by the warehousing providers module.
 */
export const WAREHOUSING_PROVIDER_EVENTS = [
  'WAREHOUSING_PROVIDER_CREATE',
  'WAREHOUSING_PROVIDER_UPDATE',
  'WAREHOUSING_PROVIDER_REMOVE',
] as const;
export type WarehousingProviderEventType = (typeof WAREHOUSING_PROVIDER_EVENTS)[number];

/**
 * Build filter selector from query parameters.
 */
export function buildFindSelector({
  includeDeleted = false,
  queryString,
  warehousingProviderIds,
  type,
}: WarehousingProviderQuery = {}): FilterQuery<WarehousingProvider> {
  const selector: FilterQuery<WarehousingProvider> = includeDeleted ? {} : { deleted: null };

  if (warehousingProviderIds && warehousingProviderIds.length > 0) {
    selector._id = { $in: warehousingProviderIds };
  }

  if (type) {
    selector.type = type;
  }

  if (queryString) {
    // Use regex for searching _id and adapterKey
    selector.$or = [{ _id: { $regex: queryString } }, { adapterKey: { $regex: queryString } }];
  }

  return selector;
}

// Memoization cache for allProviders query
const allProvidersCache = new ExpiryMap(process.env.NODE_ENV === 'production' ? 60000 : 1);

/**
 * Configure the warehousing providers module.
 */
export function configureWarehousingProvidersModule(store: IStore) {
  // Register events for this module
  registerEvents([...WAREHOUSING_PROVIDER_EVENTS]);

  const WarehousingProviders = store.table<WarehousingProvider>('warehousing-providers');

  return {
    /**
     * Count warehousing providers matching the query.
     */
    count: async (query: WarehousingProviderQuery = {}): Promise<number> => {
      return WarehousingProviders.countDocuments(buildFindSelector(query));
    },

    /**
     * Find a single warehousing provider by ID.
     */
    findProvider: async ({
      warehousingProviderId,
    }: {
      warehousingProviderId: string;
    }): Promise<WarehousingProvider | null> => {
      return WarehousingProviders.findOne({ _id: warehousingProviderId });
    },

    /**
     * Find warehousing providers matching the query.
     */
    findProviders: async (query: WarehousingProviderQuery = {}): Promise<WarehousingProvider[]> => {
      const { limit, offset, sort, ...filterQuery } = query;
      const defaultSort: SortOption[] = [{ key: 'created', value: 'ASC' }];

      const options: FindOptions = {
        limit,
        offset,
        sort: sort || defaultSort,
      };

      return WarehousingProviders.find(buildFindSelector(filterQuery), options);
    },

    /**
     * Get all active warehousing providers (cached).
     */
    allProviders: pMemoize(
      async function (): Promise<WarehousingProvider[]> {
        return WarehousingProviders.find(
          { deleted: null },
          { sort: [{ key: 'created', value: 'ASC' }] },
        );
      },
      {
        cache: allProvidersCache,
      },
    ),

    /**
     * Check if a warehousing provider exists.
     */
    providerExists: async ({
      warehousingProviderId,
    }: {
      warehousingProviderId: string;
    }): Promise<boolean> => {
      const count = await WarehousingProviders.countDocuments({
        _id: warehousingProviderId,
        deleted: null,
      });
      return count > 0;
    },

    /**
     * Create a new warehousing provider.
     */
    create: async (
      doc: Omit<WarehousingProvider, '_id' | 'created' | 'updated' | 'deleted'> & {
        _id?: string;
        created?: Date;
      },
    ): Promise<WarehousingProvider> => {
      const warehousingProviderId = doc._id || generateId();
      await WarehousingProviders.insertOne({
        _id: warehousingProviderId,
        created: doc.created || new Date(),
        type: doc.type,
        adapterKey: doc.adapterKey,
        configuration: doc.configuration,
        deleted: null,
      });

      const warehousingProvider = (await WarehousingProviders.findOne({
        _id: warehousingProviderId,
      })) as WarehousingProvider;

      allProvidersCache.clear();
      await emit('WAREHOUSING_PROVIDER_CREATE', { warehousingProvider });
      return warehousingProvider;
    },

    /**
     * Update a warehousing provider.
     */
    update: async (
      _id: string,
      doc: Partial<Omit<WarehousingProvider, '_id' | 'created'>>,
    ): Promise<WarehousingProvider | null> => {
      await WarehousingProviders.updateOne(
        { _id },
        {
          $set: {
            ...doc,
            updated: new Date(),
          },
        },
      );

      const warehousingProvider = await WarehousingProviders.findOne({ _id });
      if (!warehousingProvider) return null;

      allProvidersCache.clear();
      await emit('WAREHOUSING_PROVIDER_UPDATE', { warehousingProvider });
      return warehousingProvider;
    },

    /**
     * Soft-delete a warehousing provider.
     */
    delete: async (_id: string): Promise<WarehousingProvider | null> => {
      await WarehousingProviders.updateOne(
        { _id },
        {
          $set: {
            deleted: new Date(),
          },
        },
      );

      const warehousingProvider = await WarehousingProviders.findOne({ _id });
      if (!warehousingProvider) return null;

      allProvidersCache.clear();
      await emit('WAREHOUSING_PROVIDER_REMOVE', { warehousingProvider });
      return warehousingProvider;
    },
  };
}

/**
 * Type of the configured warehousing providers module.
 */
export type WarehousingProvidersModule = ReturnType<typeof configureWarehousingProvidersModule>;
