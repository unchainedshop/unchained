/**
 * Countries Module - Drizzle ORM with SQLite/Turso
 */

import { emit, registerEvents } from '@unchainedshop/events';
import { systemLocale, SortDirection, type SortOption } from '@unchainedshop/utils';
import {
  eq,
  and,
  isNull,
  isNotNull,
  inArray,
  sql,
  asc,
  desc,
  generateId,
  type SQL,
  type DrizzleDb,
} from '@unchainedshop/store';
import { countries, type CountryRow } from '../db/schema.ts';
import { searchCountriesFTS } from '../db/fts.ts';

export interface Country {
  _id: string;
  isoCode: string;
  isActive?: boolean;
  defaultCurrencyCode?: string;
  created: Date;
  updated?: Date;
  deleted?: Date | null;
}

export type CountryFields = keyof Country;

export interface CountryQuery {
  includeInactive?: boolean;
  queryString?: string;
  isoCodes?: string[];
  limit?: number;
  offset?: number;
  sort?: SortOption[];
}

export interface CountryQueryOptions {
  fields?: CountryFields[];
}

export interface CreateCountryInput {
  _id?: string;
  isoCode: string;
  isActive?: boolean;
  defaultCurrencyCode?: string;
  created?: Date;
}

export type UpdateCountryInput = Partial<Omit<Country, '_id' | 'created'>>;

export const COUNTRY_EVENTS = ['COUNTRY_CREATE', 'COUNTRY_UPDATE', 'COUNTRY_REMOVE'] as const;

const rowToCountry = (row: CountryRow): Country => ({
  _id: row._id,
  isoCode: row.isoCode,
  isActive: row.isActive ?? undefined,
  defaultCurrencyCode: row.defaultCurrencyCode ?? undefined,
  created: row.created,
  updated: row.updated ?? undefined,
  deleted: row.deleted ?? null,
});

const COLUMNS = {
  _id: countries._id,
  isoCode: countries.isoCode,
  created: countries.created,
  updated: countries.updated,
  deleted: countries.deleted,
  isActive: countries.isActive,
  defaultCurrencyCode: countries.defaultCurrencyCode,
} as const;

const buildSelectColumns = (fields?: CountryFields[]) => {
  if (!fields?.length) return undefined; // undefined means select all
  return Object.fromEntries(fields.map((field) => [field, COLUMNS[field]])) as Partial<typeof COLUMNS>;
};

export async function configureCountriesModule({ db }: { db: DrizzleDb }) {
  registerEvents([...COUNTRY_EVENTS]);

  // Build filter conditions from query params
  const buildConditions = async (query: CountryQuery): Promise<SQL[]> => {
    const conditions: SQL[] = [isNull(countries.deleted)];

    if (!query.includeInactive) {
      conditions.push(eq(countries.isActive, true));
    }

    if (query.isoCodes?.length) {
      conditions.push(inArray(countries.isoCode, query.isoCodes));
    }

    if (query.queryString) {
      const matchingIds = await searchCountriesFTS(db, query.queryString);
      if (matchingIds.length === 0) {
        // Return impossible condition to yield empty results
        conditions.push(sql`0 = 1`);
      } else {
        conditions.push(inArray(countries._id, matchingIds));
      }
    }

    return conditions;
  };

  // Build sort expressions from query params
  const buildOrderBy = (sort?: SortOption[]) => {
    if (!sort?.length) return [asc(countries.created)];
    return sort.map((s) => {
      const column = COLUMNS[s.key as keyof typeof COLUMNS] ?? countries.created;
      return s.value === SortDirection.DESC ? desc(column) : asc(column);
    });
  };

  return {
    count: async (query: CountryQuery = {}): Promise<number> => {
      const conditions = await buildConditions(query);
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(countries)
        .where(and(...conditions));
      return count ?? 0;
    },

    findCountry: async (
      params: { countryId: string } | { isoCode: string },
    ): Promise<Country | null> => {
      const condition =
        'countryId' in params
          ? eq(countries._id, params.countryId)
          : eq(countries.isoCode, params.isoCode);

      const [row] = await db.select().from(countries).where(condition).limit(1);
      return row ? rowToCountry(row) : null;
    },

    findCountries: async (
      query: CountryQuery = {},
      options?: CountryQueryOptions,
    ): Promise<Country[]> => {
      const conditions = await buildConditions(query);
      const orderBy = buildOrderBy(query.sort);
      const selectColumns = buildSelectColumns(options?.fields);

      const baseQuery = selectColumns
        ? db.select(selectColumns).from(countries)
        : db.select().from(countries);

      const results = await baseQuery
        .where(and(...conditions))
        .orderBy(...orderBy)
        .limit(query.limit ?? 1000)
        .offset(query.offset ?? 0);

      return selectColumns ? (results as Country[]) : results.map(rowToCountry);
    },

    countryExists: async ({ countryId }: { countryId: string }): Promise<boolean> => {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(countries)
        .where(and(eq(countries._id, countryId), isNull(countries.deleted)));
      return (count ?? 0) > 0;
    },

    name: (country: Country, locale: Intl.Locale): string =>
      new Intl.DisplayNames([locale], { type: 'region', fallback: 'code' }).of(country.isoCode) ||
      country.isoCode,

    flagEmoji: (country: Country): string =>
      Array.from(country.isoCode.toUpperCase())
        .map((c) => String.fromCodePoint(c.charCodeAt(0) + 127397))
        .join(''),

    isBase: (country: Country): boolean => country.isoCode === (systemLocale.region || 'CH'),

    create: async (doc: CreateCountryInput): Promise<string> => {
      // Remove any soft-deleted country with same ISO code
      await db
        .delete(countries)
        .where(and(eq(countries.isoCode, doc.isoCode.toUpperCase()), isNotNull(countries.deleted)));

      const countryId = doc._id || generateId();
      await db.insert(countries).values({
        _id: countryId,
        isoCode: doc.isoCode.toUpperCase(),
        isActive: doc.isActive ?? true,
        defaultCurrencyCode: doc.defaultCurrencyCode,
        created: doc.created || new Date(),
        deleted: null,
      });

      await emit('COUNTRY_CREATE', { countryId });
      return countryId;
    },

    update: async (countryId: string, doc: UpdateCountryInput): Promise<string> => {
      await db
        .update(countries)
        .set({ ...doc, updated: new Date() })
        .where(eq(countries._id, countryId));

      await emit('COUNTRY_UPDATE', { countryId });
      return countryId;
    },

    delete: async (countryId: string): Promise<number> => {
      const result = await db
        .update(countries)
        .set({ deleted: new Date() })
        .where(eq(countries._id, countryId));

      await emit('COUNTRY_REMOVE', { countryId });
      return result.rowsAffected;
    },
  };
}

export type CountriesModule = Awaited<ReturnType<typeof configureCountriesModule>>;
