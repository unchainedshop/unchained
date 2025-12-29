/**
 * Currencies Module - Drizzle ORM with SQLite/Turso
 */

import { emit, registerEvents } from '@unchainedshop/events';
import { SortDirection, type SortOption } from '@unchainedshop/utils';
import {
  eq,
  and,
  isNull,
  isNotNull,
  inArray,
  sql,
  asc,
  desc,
  type SQL,
  type DrizzleDb,
} from '@unchainedshop/store';
import { currencies, type CurrencyRow } from '../db/schema.ts';
import { searchCurrenciesFTS } from '../db/fts.ts';

export interface Currency {
  _id: string;
  isoCode: string;
  isActive?: boolean;
  contractAddress?: string;
  decimals?: number;
  created: Date;
  updated?: Date;
  deleted?: Date | null;
}

export type CurrencyFields = keyof Currency;

export interface CurrencyQuery {
  includeInactive?: boolean;
  contractAddress?: string;
  queryString?: string;
  isoCodes?: string[];
  limit?: number;
  offset?: number;
  sort?: SortOption[];
}

export interface CurrencyQueryOptions {
  fields?: CurrencyFields[];
}

export interface CreateCurrencyInput {
  _id?: string;
  isoCode: string;
  isActive?: boolean;
  contractAddress?: string;
  decimals?: number;
  created?: Date;
}

export type UpdateCurrencyInput = Partial<Omit<Currency, '_id' | 'created'>>;

export const CURRENCY_EVENTS = ['CURRENCY_CREATE', 'CURRENCY_UPDATE', 'CURRENCY_REMOVE'] as const;

const generateId = (): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
};

const rowToCurrency = (row: CurrencyRow): Currency => ({
  _id: row._id,
  isoCode: row.isoCode,
  isActive: row.isActive ?? undefined,
  contractAddress: row.contractAddress ?? undefined,
  decimals: row.decimals ?? undefined,
  created: row.created,
  updated: row.updated ?? undefined,
  deleted: row.deleted ?? null,
});

const COLUMNS = {
  _id: currencies._id,
  isoCode: currencies.isoCode,
  created: currencies.created,
  updated: currencies.updated,
  deleted: currencies.deleted,
  isActive: currencies.isActive,
  contractAddress: currencies.contractAddress,
  decimals: currencies.decimals,
} as const;

const buildSelectColumns = (fields?: CurrencyFields[]) => {
  if (!fields?.length) return undefined; // undefined means select all
  return Object.fromEntries(fields.map((field) => [field, COLUMNS[field]])) as Partial<typeof COLUMNS>;
};

export async function configureCurrenciesModule({ db }: { db: DrizzleDb }) {
  registerEvents([...CURRENCY_EVENTS]);

  // Build filter conditions from query params
  const buildConditions = async (query: CurrencyQuery): Promise<SQL[]> => {
    const conditions: SQL[] = [isNull(currencies.deleted)];

    if (!query.includeInactive) {
      conditions.push(eq(currencies.isActive, true));
    }

    if (query.contractAddress) {
      conditions.push(eq(currencies.contractAddress, query.contractAddress));
    }

    if (query.isoCodes?.length) {
      conditions.push(inArray(currencies.isoCode, query.isoCodes));
    }

    if (query.queryString) {
      const matchingIds = await searchCurrenciesFTS(db, query.queryString);
      if (matchingIds.length === 0) {
        // Return impossible condition to yield empty results
        conditions.push(sql`0 = 1`);
      } else {
        conditions.push(inArray(currencies._id, matchingIds));
      }
    }

    return conditions;
  };

  // Build sort expressions from query params
  const buildOrderBy = (sort?: SortOption[]) => {
    if (!sort?.length) return [asc(currencies.created)];
    return sort.map((s) => {
      const column = COLUMNS[s.key as keyof typeof COLUMNS] ?? currencies.created;
      return s.value === SortDirection.DESC ? desc(column) : asc(column);
    });
  };

  return {
    count: async (query: CurrencyQuery = {}): Promise<number> => {
      const conditions = await buildConditions(query);
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(currencies)
        .where(and(...conditions));
      return count ?? 0;
    },

    findCurrency: async (
      params: { currencyId: string } | { isoCode: string },
    ): Promise<Currency | null> => {
      const condition =
        'currencyId' in params
          ? eq(currencies._id, params.currencyId)
          : eq(currencies.isoCode, params.isoCode);

      const [row] = await db.select().from(currencies).where(condition).limit(1);
      return row ? rowToCurrency(row) : null;
    },

    findCurrencies: async (
      query: CurrencyQuery = {},
      options?: CurrencyQueryOptions,
    ): Promise<Currency[]> => {
      const conditions = await buildConditions(query);
      const orderBy = buildOrderBy(query.sort);
      const selectColumns = buildSelectColumns(options?.fields);

      const baseQuery = selectColumns
        ? db.select(selectColumns).from(currencies)
        : db.select().from(currencies);

      const results = await baseQuery
        .where(and(...conditions))
        .orderBy(...orderBy)
        .limit(query.limit ?? 1000)
        .offset(query.offset ?? 0);

      return selectColumns ? (results as Currency[]) : results.map(rowToCurrency);
    },

    currencyExists: async ({ currencyId }: { currencyId: string }): Promise<boolean> => {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(currencies)
        .where(and(eq(currencies._id, currencyId), isNull(currencies.deleted)));
      return (count ?? 0) > 0;
    },

    create: async (doc: CreateCurrencyInput): Promise<string> => {
      // Remove any soft-deleted currency with same ISO code
      await db
        .delete(currencies)
        .where(and(eq(currencies.isoCode, doc.isoCode.toUpperCase()), isNotNull(currencies.deleted)));

      const currencyId = doc._id || generateId();
      await db.insert(currencies).values({
        _id: currencyId,
        isoCode: doc.isoCode.toUpperCase(),
        isActive: doc.isActive ?? true,
        contractAddress: doc.contractAddress,
        decimals: doc.decimals,
        created: doc.created || new Date(),
        deleted: null,
      });

      await emit('CURRENCY_CREATE', { currencyId });
      return currencyId;
    },

    update: async (currencyId: string, doc: UpdateCurrencyInput): Promise<string> => {
      const updateDoc = { ...doc };
      if (updateDoc.isoCode) {
        updateDoc.isoCode = updateDoc.isoCode.toUpperCase();
      }

      await db
        .update(currencies)
        .set({ ...updateDoc, updated: new Date() })
        .where(eq(currencies._id, currencyId));

      await emit('CURRENCY_UPDATE', { currencyId });
      return currencyId;
    },

    delete: async (currencyId: string): Promise<number> => {
      const result = await db
        .update(currencies)
        .set({ deleted: new Date() })
        .where(eq(currencies._id, currencyId));

      await emit('CURRENCY_REMOVE', { currencyId });
      return result.rowsAffected;
    },
  };
}

export type CurrenciesModule = Awaited<ReturnType<typeof configureCurrenciesModule>>;
