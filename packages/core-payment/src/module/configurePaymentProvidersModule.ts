/**
 * Isomorphic Payment Providers Module
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
 * Payment providers table schema for Turso/SQLite.
 */
export const paymentProvidersSchema: TableSchema = {
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
    { name: 'idx_payment_type', columns: ['type'] },
    { name: 'idx_payment_created', columns: ['created'] },
    { name: 'idx_payment_deleted', columns: ['deleted'] },
  ],
};

/**
 * Payment provider type enum.
 */
export const PaymentProviderType = {
  INVOICE: 'INVOICE',
  GENERIC: 'GENERIC',
} as const;

export type PaymentProviderType = (typeof PaymentProviderType)[keyof typeof PaymentProviderType];

/**
 * Configuration key-value pairs for payment providers.
 */
export type PaymentConfiguration = {
  key: string;
  value: string | null;
}[];

/**
 * Payment provider entity.
 */
export interface PaymentProvider extends Entity, TimestampFields {
  _id: string;
  type: PaymentProviderType;
  adapterKey: string;
  configuration: PaymentConfiguration;
}

/**
 * Payment interface for adapter registration.
 */
export interface PaymentInterface {
  _id: string;
  label: string;
  version: string;
}

/**
 * Query parameters for finding payment providers.
 */
export interface PaymentProviderQuery {
  paymentProviderIds?: string[];
  type?: PaymentProviderType;
  includeDeleted?: boolean;
  queryString?: string;
  limit?: number;
  offset?: number;
  sort?: SortOption[];
}

/**
 * Events emitted by the payment providers module.
 */
export const PAYMENT_PROVIDER_EVENTS = [
  'PAYMENT_PROVIDER_CREATE',
  'PAYMENT_PROVIDER_UPDATE',
  'PAYMENT_PROVIDER_REMOVE',
] as const;
export type PaymentProviderEventType = (typeof PAYMENT_PROVIDER_EVENTS)[number];

/**
 * Build filter selector from query parameters.
 */
export function buildFindSelector({
  includeDeleted = false,
  queryString,
  paymentProviderIds,
  type,
}: PaymentProviderQuery = {}): FilterQuery<PaymentProvider> {
  const selector: FilterQuery<PaymentProvider> = includeDeleted ? {} : { deleted: null };

  if (paymentProviderIds && paymentProviderIds.length > 0) {
    selector._id = { $in: paymentProviderIds };
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
 * Configure the payment providers module.
 */
export function configurePaymentProvidersModule(store: IStore) {
  // Register events for this module
  registerEvents([...PAYMENT_PROVIDER_EVENTS]);

  const PaymentProviders = store.table<PaymentProvider>('payment-providers');

  return {
    /**
     * Count payment providers matching the query.
     */
    count: async (query: PaymentProviderQuery = {}): Promise<number> => {
      return PaymentProviders.countDocuments(buildFindSelector(query));
    },

    /**
     * Find a single payment provider by ID.
     */
    findProvider: async ({
      paymentProviderId,
    }: {
      paymentProviderId: string;
    }): Promise<PaymentProvider | null> => {
      return PaymentProviders.findOne({ _id: paymentProviderId });
    },

    /**
     * Find payment providers matching the query.
     */
    findProviders: async (query: PaymentProviderQuery = {}): Promise<PaymentProvider[]> => {
      const { limit, offset, sort, ...filterQuery } = query;
      const defaultSort: SortOption[] = [{ key: 'created', value: 'ASC' }];

      const options: FindOptions = {
        limit,
        offset,
        sort: sort || defaultSort,
      };

      return PaymentProviders.find(buildFindSelector(filterQuery), options);
    },

    /**
     * Get all active payment providers (cached).
     */
    allProviders: pMemoize(
      async function (): Promise<PaymentProvider[]> {
        return PaymentProviders.find({ deleted: null }, { sort: [{ key: 'created', value: 'ASC' }] });
      },
      {
        cache: allProvidersCache,
      },
    ),

    /**
     * Check if a payment provider exists.
     */
    providerExists: async ({ paymentProviderId }: { paymentProviderId: string }): Promise<boolean> => {
      const count = await PaymentProviders.countDocuments({ _id: paymentProviderId, deleted: null });
      return count > 0;
    },

    /**
     * Create a new payment provider.
     */
    create: async (
      doc: Omit<PaymentProvider, '_id' | 'created' | 'updated' | 'deleted'> & {
        _id?: string;
        created?: Date;
      },
    ): Promise<PaymentProvider> => {
      const paymentProviderId = doc._id || generateId();
      await PaymentProviders.insertOne({
        _id: paymentProviderId,
        created: doc.created || new Date(),
        type: doc.type,
        adapterKey: doc.adapterKey,
        configuration: doc.configuration,
        deleted: null,
      });

      const paymentProvider = (await PaymentProviders.findOne({
        _id: paymentProviderId,
      })) as PaymentProvider;

      allProvidersCache.clear();
      await emit('PAYMENT_PROVIDER_CREATE', { paymentProvider });
      return paymentProvider;
    },

    /**
     * Update a payment provider.
     */
    update: async (
      _id: string,
      doc: Partial<Omit<PaymentProvider, '_id' | 'created'>>,
    ): Promise<PaymentProvider | null> => {
      await PaymentProviders.updateOne(
        { _id },
        {
          $set: {
            ...doc,
            updated: new Date(),
          },
        },
      );

      const paymentProvider = await PaymentProviders.findOne({ _id });
      if (!paymentProvider) return null;

      allProvidersCache.clear();
      await emit('PAYMENT_PROVIDER_UPDATE', { paymentProvider });
      return paymentProvider;
    },

    /**
     * Soft-delete a payment provider.
     */
    delete: async (_id: string): Promise<PaymentProvider | null> => {
      await PaymentProviders.updateOne(
        { _id },
        {
          $set: {
            deleted: new Date(),
          },
        },
      );

      const paymentProvider = await PaymentProviders.findOne({ _id });
      if (!paymentProvider) return null;

      allProvidersCache.clear();
      await emit('PAYMENT_PROVIDER_REMOVE', { paymentProvider });
      return paymentProvider;
    },
  };
}

/**
 * Type of the configured payment providers module.
 */
export type PaymentProvidersModule = ReturnType<typeof configurePaymentProvidersModule>;
