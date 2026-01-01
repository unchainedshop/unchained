/**
 * Languages Module - Drizzle ORM with SQLite/Turso
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
  buildSelectColumns,
  type SQL,
  type DrizzleDb,
} from '@unchainedshop/store';
import { languages, type LanguageRow } from '../db/schema.ts';
import { searchLanguagesFTS } from '../db/fts.ts';

export interface Language {
  _id: string;
  isoCode: string;
  isActive?: boolean;
  created: Date;
  updated?: Date;
  deleted?: Date | null;
}

export type LanguageFields = keyof Language;

export interface LanguageQuery {
  includeInactive?: boolean;
  queryString?: string;
  isoCodes?: string[];
  limit?: number;
  offset?: number;
  sort?: SortOption[];
}

export interface LanguageQueryOptions {
  fields?: LanguageFields[];
}

export interface CreateLanguageInput {
  _id?: string;
  isoCode: string;
  isActive?: boolean;
  created?: Date;
}

export type UpdateLanguageInput = Partial<Omit<Language, '_id' | 'created'>>;

export const LANGUAGE_EVENTS = ['LANGUAGE_CREATE', 'LANGUAGE_UPDATE', 'LANGUAGE_REMOVE'] as const;

const rowToLanguage = (row: LanguageRow): Language => ({
  _id: row._id,
  isoCode: row.isoCode,
  isActive: row.isActive ?? undefined,
  created: row.created,
  updated: row.updated ?? undefined,
  deleted: row.deleted ?? null,
});

const COLUMNS = {
  _id: languages._id,
  isoCode: languages.isoCode,
  created: languages.created,
  updated: languages.updated,
  deleted: languages.deleted,
  isActive: languages.isActive,
} as const;

export async function configureLanguagesModule({ db }: { db: DrizzleDb }) {
  registerEvents([...LANGUAGE_EVENTS]);

  // Build filter conditions from query params
  const buildConditions = async (query: LanguageQuery): Promise<SQL[]> => {
    const conditions: SQL[] = [isNull(languages.deleted)];

    if (!query.includeInactive) {
      conditions.push(eq(languages.isActive, true));
    }

    if (query.isoCodes?.length) {
      conditions.push(inArray(languages.isoCode, query.isoCodes));
    }

    if (query.queryString) {
      const matchingIds = await searchLanguagesFTS(db, query.queryString);
      // Drizzle handles empty arrays natively - inArray with [] returns false
      conditions.push(inArray(languages._id, matchingIds));
    }

    return conditions;
  };

  // Build sort expressions from query params
  const buildOrderBy = (sort?: SortOption[]) => {
    if (!sort?.length) return [asc(languages.created)];
    return sort.map((s) => {
      const column = COLUMNS[s.key as keyof typeof COLUMNS] ?? languages.created;
      return s.value === SortDirection.DESC ? desc(column) : asc(column);
    });
  };

  return {
    count: async (query: LanguageQuery = {}): Promise<number> => {
      const conditions = await buildConditions(query);
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(languages)
        .where(and(...conditions));
      return count ?? 0;
    },

    findLanguage: async (
      params: { languageId: string } | { isoCode: string },
    ): Promise<Language | null> => {
      const condition =
        'languageId' in params
          ? eq(languages._id, params.languageId)
          : eq(languages.isoCode, params.isoCode);

      const [row] = await db.select().from(languages).where(condition).limit(1);
      return row ? rowToLanguage(row) : null;
    },

    findLanguages: async (
      query: LanguageQuery = {},
      options?: LanguageQueryOptions,
    ): Promise<Language[]> => {
      const conditions = await buildConditions(query);
      const orderBy = buildOrderBy(query.sort);
      const selectColumns = buildSelectColumns(COLUMNS, options?.fields);

      const baseQuery = selectColumns
        ? db.select(selectColumns).from(languages)
        : db.select().from(languages);

      const results = await baseQuery
        .where(and(...conditions))
        .orderBy(...orderBy)
        .limit(query.limit ?? 1000)
        .offset(query.offset ?? 0);

      return selectColumns ? (results as Language[]) : results.map(rowToLanguage);
    },

    languageExists: async ({ languageId }: { languageId: string }): Promise<boolean> => {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(languages)
        .where(and(eq(languages._id, languageId), isNull(languages.deleted)));
      return (count ?? 0) > 0;
    },

    isBase(language: Language): boolean {
      return language.isoCode === systemLocale.language;
    },

    create: async (doc: CreateLanguageInput): Promise<string> => {
      // Remove any soft-deleted language with same ISO code
      await db
        .delete(languages)
        .where(and(eq(languages.isoCode, doc.isoCode.toLowerCase()), isNotNull(languages.deleted)));

      const languageId = doc._id || generateId();
      await db.insert(languages).values({
        _id: languageId,
        isoCode: doc.isoCode.toLowerCase(),
        isActive: doc.isActive ?? true,
        created: doc.created || new Date(),
        deleted: null,
      });

      await emit('LANGUAGE_CREATE', { languageId });
      return languageId;
    },

    update: async (languageId: string, doc: UpdateLanguageInput): Promise<Language | null> => {
      const updateDoc = { ...doc };
      if (updateDoc.isoCode) {
        updateDoc.isoCode = updateDoc.isoCode.toLowerCase();
      }

      await db
        .update(languages)
        .set({ ...updateDoc, updated: new Date() })
        .where(eq(languages._id, languageId));

      const [updatedRow] = await db
        .select()
        .from(languages)
        .where(eq(languages._id, languageId))
        .limit(1);

      if (!updatedRow) return null;

      const language = rowToLanguage(updatedRow);
      await emit('LANGUAGE_UPDATE', { languageId, language });
      return language;
    },

    delete: async (languageId: string): Promise<number> => {
      const result = await db
        .update(languages)
        .set({ deleted: new Date() })
        .where(eq(languages._id, languageId));

      await emit('LANGUAGE_REMOVE', { languageId });
      return result.rowsAffected;
    },
  };
}

export type LanguagesModule = Awaited<ReturnType<typeof configureLanguagesModule>>;
