/**
 * Isomorphic Countries Module
 *
 * This module works in both browser and Node.js environments.
 * It uses the @unchainedshop/store abstraction for storage.
 */

import { emit, registerEvents } from '@unchainedshop/events';
import { systemLocale } from '@unchainedshop/utils';
import type {
  Entity,
  TimestampFields,
  SortDirection,
  SortOption,
  IStore,
  FilterQuery,
  FindOptions,
  TableSchema,
} from '@unchainedshop/store';

/**
 * Countries table schema for Turso/SQLite.
 * Used for server-side storage with FTS5 full-text search.
 */
export const countriesSchema: TableSchema = {
  columns: [
    { name: '_id', type: 'TEXT', primaryKey: true },
    { name: 'isoCode', type: 'TEXT', notNull: true, unique: true },
    { name: 'isActive', type: 'INTEGER' },
    { name: 'defaultCurrencyCode', type: 'TEXT' },
    { name: 'created', type: 'INTEGER', notNull: true },
    { name: 'updated', type: 'INTEGER' },
    { name: 'deleted', type: 'INTEGER' },
  ],
  indexes: [
    { name: 'idx_countries_isoCode', columns: ['isoCode'], unique: true },
    { name: 'idx_countries_deleted', columns: ['deleted'] },
    { name: 'idx_countries_isActive', columns: ['isActive'] },
  ],
  fts: {
    columns: ['isoCode', 'defaultCurrencyCode'],
    tokenizer: 'unicode61',
  },
};

/**
 * Country entity representing a country in the system.
 */
export interface Country extends Entity, TimestampFields {
  _id: string;
  isoCode: string;
  isActive?: boolean;
  defaultCurrencyCode?: string;
}

/**
 * Query parameters for finding countries.
 */
export interface CountryQuery {
  includeInactive?: boolean;
  queryString?: string;
  isoCodes?: string[];
  limit?: number;
  offset?: number;
  sort?: SortOption[];
}

/**
 * Input for creating a new country.
 */
export type CreateCountryInput = Omit<Country, '_id' | 'created' | 'updated' | 'deleted'> & {
  _id?: string;
  created?: Date;
};

/**
 * Input for updating a country.
 */
export type UpdateCountryInput = Partial<Omit<Country, '_id' | 'created'>>;

/**
 * Events emitted by the countries module.
 */
export const COUNTRY_EVENTS = ['COUNTRY_CREATE', 'COUNTRY_UPDATE', 'COUNTRY_REMOVE'] as const;
export type CountryEventType = (typeof COUNTRY_EVENTS)[number];

/**
 * Module input configuration.
 */
export interface CountriesModuleInput {
  store: IStore;
}

/**
 * Get the system region from systemLocale.
 */
const getSystemRegion = (): string => {
  return systemLocale.region || 'CH';
};

/**
 * Generate a unique ID.
 */
function generateId(): string {
  const timestamp = Math.floor(Date.now() / 1000).toString(16);
  const randomPart = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join(
    '',
  );
  return timestamp + randomPart;
}

/**
 * Build filter selector from query parameters.
 */
export function buildFindSelector({
  includeInactive = false,
  queryString = '',
  isoCodes,
}: CountryQuery): FilterQuery<Country> {
  const selector: FilterQuery<Country> = { deleted: null };

  if (!includeInactive) {
    selector.isActive = true;
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
 * Configure the countries module.
 * This function works in both browser and Node.js.
 */
export async function configureCountriesModule({ store }: CountriesModuleInput) {
  // Register events for this module
  registerEvents([...COUNTRY_EVENTS]);

  const Countries = store.table<Country>('countries');

  return {
    /**
     * Count countries matching the query.
     */
    count: async (query: CountryQuery): Promise<number> => {
      return Countries.countDocuments(buildFindSelector(query));
    },

    /**
     * Find a single country by ID or ISO code.
     */
    findCountry: async (
      params: { countryId: string } | { isoCode: string },
    ): Promise<Country | null> => {
      if ('countryId' in params) {
        return Countries.findOne({ _id: params.countryId });
      }
      return Countries.findOne({ isoCode: params.isoCode });
    },

    /**
     * Find countries matching the query.
     */
    findCountries: async (query: CountryQuery): Promise<Country[]> => {
      const { limit, offset, sort, ...filterQuery } = query;
      const defaultSort: SortOption[] = [{ key: 'created', value: 'ASC' as SortDirection }];

      const options: FindOptions = {
        limit,
        offset,
        sort: sort || defaultSort,
      };

      return Countries.find(buildFindSelector(filterQuery), options);
    },

    /**
     * Check if a country exists.
     */
    countryExists: async ({ countryId }: { countryId: string }): Promise<boolean> => {
      const count = await Countries.countDocuments({ _id: countryId, deleted: null });
      return count > 0;
    },

    /**
     * Get the display name of a country.
     */
    name(country: Country, locale: Intl.Locale): string {
      return (
        new Intl.DisplayNames([locale], { type: 'region', fallback: 'code' }).of(country.isoCode) ||
        country.isoCode
      );
    },

    /**
     * Get the flag emoji for a country.
     */
    flagEmoji(country: Country): string {
      const letterToLetterEmoji = (letter: string): string => {
        return String.fromCodePoint(letter.toLowerCase().charCodeAt(0) + 127365);
      };
      return Array.from(country.isoCode.toUpperCase()).map(letterToLetterEmoji).join('');
    },

    /**
     * Check if a country is the base/system country.
     */
    isBase(country: Country): boolean {
      return country.isoCode === getSystemRegion();
    },

    /**
     * Create a new country.
     */
    create: async (doc: CreateCountryInput): Promise<string> => {
      // Delete any previously soft-deleted country with same ISO code
      await Countries.deleteOne({ isoCode: doc.isoCode.toUpperCase(), deleted: { $ne: null } });

      const countryId = doc._id || generateId();
      await Countries.insertOne({
        _id: countryId,
        created: doc.created || new Date(),
        isoCode: doc.isoCode.toUpperCase(),
        isActive: doc.isActive ?? true,
        defaultCurrencyCode: doc.defaultCurrencyCode,
        deleted: null,
      });

      await emit('COUNTRY_CREATE', { countryId });
      return countryId;
    },

    /**
     * Update an existing country.
     */
    update: async (countryId: string, doc: UpdateCountryInput): Promise<string> => {
      await Countries.updateOne(
        { _id: countryId },
        {
          $set: {
            ...doc,
            updated: new Date(),
          },
        },
      );

      await emit('COUNTRY_UPDATE', { countryId });
      return countryId;
    },

    /**
     * Soft-delete a country.
     */
    delete: async (countryId: string): Promise<number> => {
      const result = await Countries.updateOne(
        { _id: countryId },
        {
          $set: {
            deleted: new Date(),
          },
        },
      );

      await emit('COUNTRY_REMOVE', { countryId });
      return result.modifiedCount;
    },
  };
}

/**
 * Type of the configured countries module.
 */
export type CountriesModule = Awaited<ReturnType<typeof configureCountriesModule>>;
