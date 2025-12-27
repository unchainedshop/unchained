/**
 * Isomorphic Languages Module
 *
 * This module works in both browser and Node.js environments.
 * It uses the @unchainedshop/store abstraction for storage.
 */

import { emit, registerEvents } from '@unchainedshop/events';
import { systemLocale } from '@unchainedshop/utils';
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
 * Languages table schema for Turso/SQLite.
 * Used for server-side storage with FTS5 full-text search.
 */
export const languagesSchema: TableSchema = {
  columns: [
    { name: '_id', type: 'TEXT', primaryKey: true },
    { name: 'isoCode', type: 'TEXT', notNull: true, unique: true },
    { name: 'isActive', type: 'INTEGER' },
    { name: 'created', type: 'INTEGER', notNull: true },
    { name: 'updated', type: 'INTEGER' },
    { name: 'deleted', type: 'INTEGER' },
  ],
  indexes: [
    { name: 'idx_languages_isoCode', columns: ['isoCode'], unique: true },
    { name: 'idx_languages_deleted', columns: ['deleted'] },
  ],
  fts: {
    columns: ['isoCode'],
    tokenizer: 'unicode61',
  },
};

/**
 * Language entity representing a language in the system.
 */
export interface Language extends Entity, TimestampFields {
  _id: string;
  isoCode: string;
  isActive?: boolean;
}

/**
 * Query parameters for finding languages.
 */
export interface LanguageQuery {
  includeInactive?: boolean;
  queryString?: string;
  isoCodes?: string[];
  limit?: number;
  offset?: number;
  sort?: SortOption[];
}

/**
 * Input for creating a new language.
 */
export type CreateLanguageInput = Omit<Language, '_id' | 'created' | 'updated' | 'deleted'> & {
  _id?: string;
  created?: Date;
};

/**
 * Input for updating a language.
 */
export type UpdateLanguageInput = Partial<Omit<Language, '_id' | 'created'>>;

/**
 * Events emitted by the languages module.
 */
export const LANGUAGE_EVENTS = ['LANGUAGE_CREATE', 'LANGUAGE_UPDATE', 'LANGUAGE_REMOVE'] as const;
export type LanguageEventType = (typeof LANGUAGE_EVENTS)[number];

/**
 * Module input configuration.
 */
export interface LanguagesModuleInput {
  store: IStore;
}

/**
 * Build filter selector from query parameters.
 */
export function buildFindSelector({
  includeInactive = false,
  queryString = '',
  isoCodes,
}: LanguageQuery): FilterQuery<Language> {
  const selector: FilterQuery<Language> = { deleted: null };

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
 * Configure the languages module.
 * This function works in both browser and Node.js.
 */
export async function configureLanguagesModule({ store }: LanguagesModuleInput) {
  // Register events for this module
  registerEvents([...LANGUAGE_EVENTS]);

  const Languages = store.table<Language>('languages');

  return {
    /**
     * Find a single language by ID or ISO code.
     */
    findLanguage: async (
      params: { languageId: string } | { isoCode: string },
    ): Promise<Language | null> => {
      if ('languageId' in params) {
        return Languages.findOne({ _id: params.languageId });
      }
      return Languages.findOne({ isoCode: params.isoCode });
    },

    /**
     * Find languages matching the query.
     */
    findLanguages: async (query: LanguageQuery): Promise<Language[]> => {
      const { limit, offset, sort, ...filterQuery } = query;
      const defaultSort: SortOption[] = [{ key: 'created', value: 'ASC' as SortDirection }];

      const options: FindOptions = {
        limit,
        offset,
        sort: sort || defaultSort,
      };

      return Languages.find(buildFindSelector(filterQuery), options);
    },

    /**
     * Count languages matching the query.
     */
    count: async (query: LanguageQuery): Promise<number> => {
      return Languages.countDocuments(buildFindSelector(query));
    },

    /**
     * Check if a language exists.
     */
    languageExists: async ({ languageId }: { languageId: string }): Promise<boolean> => {
      const count = await Languages.countDocuments({ _id: languageId, deleted: null });
      return count > 0;
    },

    /**
     * Check if a language is the base/system language.
     */
    isBase(language: Language): boolean {
      return language.isoCode === systemLocale.language;
    },

    /**
     * Create a new language.
     */
    create: async (doc: CreateLanguageInput): Promise<string> => {
      // Delete any previously soft-deleted language with same ISO code
      await Languages.deleteOne({ isoCode: doc.isoCode.toLowerCase(), deleted: { $ne: null } });

      const languageId = doc._id || generateId();
      await Languages.insertOne({
        _id: languageId,
        created: doc.created || new Date(),
        isoCode: doc.isoCode.toLowerCase(),
        isActive: doc.isActive ?? true,
        deleted: null,
      });

      await emit('LANGUAGE_CREATE', { languageId });
      return languageId;
    },

    /**
     * Update an existing language.
     */
    update: async (languageId: string, doc: UpdateLanguageInput): Promise<string> => {
      const updateDoc = { ...doc };
      if (updateDoc.isoCode) {
        updateDoc.isoCode = updateDoc.isoCode.toLowerCase();
      }

      await Languages.updateOne(
        { _id: languageId },
        {
          $set: {
            ...updateDoc,
            updated: new Date(),
          },
        },
      );

      await emit('LANGUAGE_UPDATE', { languageId });
      return languageId;
    },

    /**
     * Soft-delete a language.
     */
    delete: async (languageId: string): Promise<number> => {
      const result = await Languages.updateOne(
        { _id: languageId },
        {
          $set: {
            deleted: new Date(),
          },
        },
      );

      await emit('LANGUAGE_REMOVE', { languageId });
      return result.modifiedCount;
    },
  };
}

/**
 * Type of the configured languages module.
 */
export type LanguagesModule = Awaited<ReturnType<typeof configureLanguagesModule>>;
