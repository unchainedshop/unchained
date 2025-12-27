/**
 * Isomorphic Delivery Providers Module
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
import { deliverySettings, type DeliverySettingsOptions } from '../delivery-settings.ts';
import pMemoize from 'p-memoize';
import ExpiryMap from 'expiry-map';

/**
 * Delivery providers table schema for Turso/SQLite.
 */
export const deliveryProvidersSchema: TableSchema = {
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
    { name: 'idx_delivery_type', columns: ['type'] },
    { name: 'idx_delivery_created', columns: ['created'] },
    { name: 'idx_delivery_deleted', columns: ['deleted'] },
  ],
};

/**
 * Delivery provider type enum.
 */
export const DeliveryProviderType = {
  SHIPPING: 'SHIPPING',
  PICKUP: 'PICKUP',
} as const;

export type DeliveryProviderType = (typeof DeliveryProviderType)[keyof typeof DeliveryProviderType];

/**
 * Configuration key-value pairs for delivery providers.
 */
export type DeliveryConfiguration = {
  key: string;
  value: string;
}[];

/**
 * Delivery provider entity.
 */
export interface DeliveryProvider extends Entity, TimestampFields {
  _id: string;
  type: DeliveryProviderType;
  adapterKey: string;
  configuration: DeliveryConfiguration;
}

/**
 * Delivery location type (for pickup points, etc.).
 */
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

/**
 * Delivery interface for adapter registration.
 */
export interface DeliveryInterface {
  _id: string;
  label: string;
  version: string;
}

/**
 * Query parameters for finding delivery providers.
 */
export interface DeliveryProviderQuery {
  deliveryProviderIds?: string[];
  type?: DeliveryProviderType;
  includeDeleted?: boolean;
  queryString?: string;
  limit?: number;
  offset?: number;
  sort?: SortOption[];
}

/**
 * Events emitted by the delivery module.
 */
export const DELIVERY_PROVIDER_EVENTS = [
  'DELIVERY_PROVIDER_CREATE',
  'DELIVERY_PROVIDER_UPDATE',
  'DELIVERY_PROVIDER_REMOVE',
] as const;
export type DeliveryProviderEventType = (typeof DELIVERY_PROVIDER_EVENTS)[number];

/**
 * Module input configuration.
 */
export interface DeliveryModuleInput {
  store: IStore;
  options?: DeliverySettingsOptions;
}

/**
 * Build filter selector from query parameters.
 */
export function buildFindSelector({
  includeDeleted = false,
  queryString,
  deliveryProviderIds,
  type,
}: DeliveryProviderQuery = {}): FilterQuery<DeliveryProvider> {
  const selector: FilterQuery<DeliveryProvider> = includeDeleted ? {} : { deleted: null };

  if (deliveryProviderIds && deliveryProviderIds.length > 0) {
    selector._id = { $in: deliveryProviderIds };
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
 * Configure the delivery module.
 * This function works in both browser and Node.js.
 */
export async function configureDeliveryModule({
  store,
  options: deliveryOptions = {},
}: DeliveryModuleInput) {
  // Register events for this module
  registerEvents([...DELIVERY_PROVIDER_EVENTS]);

  // Configure settings
  deliverySettings.configureSettings(deliveryOptions);

  const DeliveryProviders = store.table<DeliveryProvider>('delivery-providers');

  return {
    /**
     * Count delivery providers matching the query.
     */
    count: async (query: DeliveryProviderQuery = {}): Promise<number> => {
      return DeliveryProviders.countDocuments(buildFindSelector(query));
    },

    /**
     * Find a single delivery provider by ID.
     */
    findProvider: async ({
      deliveryProviderId,
    }: {
      deliveryProviderId: string;
    }): Promise<DeliveryProvider | null> => {
      return DeliveryProviders.findOne({ _id: deliveryProviderId });
    },

    /**
     * Find delivery providers matching the query.
     */
    findProviders: async (query: DeliveryProviderQuery = {}): Promise<DeliveryProvider[]> => {
      const { limit, offset, sort, ...filterQuery } = query;
      const defaultSort: SortOption[] = [{ key: 'created', value: 'ASC' }];

      const options: FindOptions = {
        limit,
        offset,
        sort: sort || defaultSort,
      };

      return DeliveryProviders.find(buildFindSelector(filterQuery), options);
    },

    /**
     * Get all active delivery providers (cached).
     */
    allProviders: pMemoize(
      async function (): Promise<DeliveryProvider[]> {
        return DeliveryProviders.find({ deleted: null }, { sort: [{ key: 'created', value: 'ASC' }] });
      },
      {
        cache: allProvidersCache,
      },
    ),

    /**
     * Check if a delivery provider exists.
     */
    providerExists: async ({ deliveryProviderId }: { deliveryProviderId: string }): Promise<boolean> => {
      const count = await DeliveryProviders.countDocuments({ _id: deliveryProviderId, deleted: null });
      return count > 0;
    },

    /**
     * Create a new delivery provider.
     */
    create: async (
      doc: Omit<DeliveryProvider, '_id' | 'created' | 'updated' | 'deleted'> & { _id?: string },
    ): Promise<DeliveryProvider> => {
      const deliveryProviderId = doc._id || generateId();
      await DeliveryProviders.insertOne({
        _id: deliveryProviderId,
        created: new Date(),
        type: doc.type,
        adapterKey: doc.adapterKey,
        configuration: doc.configuration,
        deleted: null,
      });

      const deliveryProvider = (await DeliveryProviders.findOne({
        _id: deliveryProviderId,
      })) as DeliveryProvider;

      allProvidersCache.clear();
      await emit('DELIVERY_PROVIDER_CREATE', { deliveryProvider });
      return deliveryProvider;
    },

    /**
     * Update a delivery provider.
     */
    update: async (
      _id: string,
      doc: Partial<Omit<DeliveryProvider, '_id' | 'created'>>,
    ): Promise<DeliveryProvider | null> => {
      await DeliveryProviders.updateOne(
        { _id },
        {
          $set: {
            ...doc,
            updated: new Date(),
          },
        },
      );

      const deliveryProvider = await DeliveryProviders.findOne({ _id });
      if (!deliveryProvider) return null;

      allProvidersCache.clear();
      await emit('DELIVERY_PROVIDER_UPDATE', { deliveryProvider });
      return deliveryProvider;
    },

    /**
     * Soft-delete a delivery provider.
     */
    delete: async (_id: string): Promise<DeliveryProvider | null> => {
      await DeliveryProviders.updateOne(
        { _id },
        {
          $set: {
            deleted: new Date(),
          },
        },
      );

      const deliveryProvider = await DeliveryProviders.findOne({ _id });
      if (!deliveryProvider) return null;

      allProvidersCache.clear();
      await emit('DELIVERY_PROVIDER_REMOVE', { deliveryProvider });
      return deliveryProvider;
    },
  };
}

/**
 * Type of the configured delivery module.
 */
export type DeliveryModule = Awaited<ReturnType<typeof configureDeliveryModule>>;
