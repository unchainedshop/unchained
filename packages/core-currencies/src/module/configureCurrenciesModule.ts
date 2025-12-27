/**
 * Isomorphic Currencies Module
 *
 * This module works in both browser and Node.js environments.
 * It uses the @unchainedshop/store abstraction for storage.
 */

import { emit, registerEvents } from '@unchainedshop/events';
import {
  generateId,
  type Entity,
  type TimestampFields,
  type SortDirection,
  type SortOption,
  type IStore,
  type FilterQuery,
  type FindOptions,
  type TableSchema,
} from '@unchainedshop/store';

/**
 * Currencies table schema for Turso/SQLite.
 * Used for server-side storage with FTS5 full-text search.
 */
export const currenciesSchema: TableSchema = {
  columns: [
    { name: '_id', type: 'TEXT', primaryKey: true },
    { name: 'isoCode', type: 'TEXT', notNull: true, unique: true },
    { name: 'isActive', type: 'INTEGER' },
    { name: 'contractAddress', type: 'TEXT' },
    { name: 'decimals', type: 'INTEGER' },
    { name: 'created', type: 'INTEGER', notNull: true },
    { name: 'updated', type: 'INTEGER' },
    { name: 'deleted', type: 'INTEGER' },
  ],
  indexes: [
    { name: 'idx_currencies_isoCode', columns: ['isoCode'], unique: true },
    { name: 'idx_currencies_deleted', columns: ['deleted'] },
  ],
  fts: {
    columns: ['isoCode', 'contractAddress'],
    tokenizer: 'unicode61',
  },
};

/**
 * Currency entity representing a currency in the system.
 */
export interface Currency extends Entity, TimestampFields {
  _id: string;
  isoCode: string;
  isActive: boolean;
  contractAddress?: string;
  decimals?: number;
}

/**
 * Query parameters for finding currencies.
 */
export interface CurrencyQuery {
  includeInactive?: boolean;
  contractAddress?: string;
  queryString?: string;
  isoCodes?: string[];
  limit?: number;
  offset?: number;
  sort?: SortOption[];
}

/**
 * Input for creating a new currency.
 */
export type CreateCurrencyInput = Omit<Currency, '_id' | 'created' | 'updated' | 'deleted'> & {
  _id?: string;
  created?: Date;
};

/**
 * Input for updating a currency.
 */
export type UpdateCurrencyInput = Partial<Omit<Currency, '_id' | 'created'>>;

/**
 * Events emitted by the currencies module.
 */
export const CURRENCY_EVENTS = ['CURRENCY_CREATE', 'CURRENCY_UPDATE', 'CURRENCY_REMOVE'] as const;
export type CurrencyEventType = (typeof CURRENCY_EVENTS)[number];

/**
 * Module input configuration.
 */
export interface CurrenciesModuleInput {
  store: IStore;
}

/**
 * Build filter selector from query parameters.
 */
export function buildFindSelector({
  includeInactive = false,
  contractAddress,
  queryString = '',
  isoCodes,
}: CurrencyQuery): FilterQuery<Currency> {
  const selector: FilterQuery<Currency> = { deleted: null };

  if (!includeInactive) {
    selector.isActive = true;
  }

  if (contractAddress) {
    selector.contractAddress = contractAddress;
  }

  if (isoCodes && isoCodes.length > 0) {
    selector.isoCode = { $in: isoCodes };
  }

  if (queryString) {
    selector.$text = { $search: queryString };
  }

  return selector;
}

/**
 * Configure the currencies module.
 * This function works in both browser and Node.js.
 */
export async function configureCurrenciesModule({ store }: CurrenciesModuleInput) {
  // Register events for this module
  registerEvents([...CURRENCY_EVENTS]);

  const Currencies = store.table<Currency>('currencies');

  return {
    /**
     * Find a single currency by ID or ISO code.
     */
    findCurrency: async (
      params: { isoCode: string } | { currencyId: string },
    ): Promise<Currency | null> => {
      if ('currencyId' in params) {
        return Currencies.findOne({ _id: params.currencyId });
      }
      return Currencies.findOne({ isoCode: params.isoCode });
    },

    /**
     * Find currencies matching the query.
     */
    findCurrencies: async (query: CurrencyQuery): Promise<Currency[]> => {
      const { limit, offset, sort, ...filterQuery } = query;
      const defaultSort: SortOption[] = [{ key: 'created', value: 'ASC' as SortDirection }];

      const options: FindOptions = {
        limit,
        offset,
        sort: sort || defaultSort,
      };

      return Currencies.find(buildFindSelector(filterQuery), options);
    },

    /**
     * Count currencies matching the query.
     */
    count: async (query: CurrencyQuery): Promise<number> => {
      return Currencies.countDocuments(buildFindSelector(query));
    },

    /**
     * Check if a currency exists.
     */
    currencyExists: async ({ currencyId }: { currencyId: string }): Promise<boolean> => {
      const count = await Currencies.countDocuments({ _id: currencyId, deleted: null });
      return count > 0;
    },

    /**
     * Create a new currency.
     */
    create: async (doc: CreateCurrencyInput): Promise<string> => {
      // Delete any previously soft-deleted currency with same ISO code
      await Currencies.deleteOne({ isoCode: doc.isoCode.toUpperCase(), deleted: { $ne: null } });

      const currencyId = doc._id || generateId();
      await Currencies.insertOne({
        _id: currencyId,
        created: doc.created || new Date(),
        isoCode: doc.isoCode.toUpperCase(),
        isActive: doc.isActive ?? true,
        contractAddress: doc.contractAddress,
        decimals: doc.decimals,
        deleted: null,
      });

      await emit('CURRENCY_CREATE', { currencyId });
      return currencyId;
    },

    /**
     * Update an existing currency.
     */
    update: async (currencyId: string, doc: UpdateCurrencyInput): Promise<string> => {
      const updateDoc = { ...doc };
      if (updateDoc.isoCode) {
        updateDoc.isoCode = updateDoc.isoCode.toUpperCase();
      }

      await Currencies.updateOne(
        { _id: currencyId },
        {
          $set: {
            ...updateDoc,
            updated: new Date(),
          },
        },
      );

      await emit('CURRENCY_UPDATE', { currencyId });
      return currencyId;
    },

    /**
     * Soft-delete a currency.
     */
    delete: async (currencyId: string): Promise<number> => {
      const result = await Currencies.updateOne(
        { _id: currencyId },
        {
          $set: {
            deleted: new Date(),
          },
        },
      );

      await emit('CURRENCY_REMOVE', { currencyId });
      return result.modifiedCount;
    },
  };
}

/**
 * Type of the configured currencies module.
 */
export type CurrenciesModule = Awaited<ReturnType<typeof configureCurrenciesModule>>;
