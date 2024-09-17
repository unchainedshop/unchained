import { ModuleInput, ModuleMutations } from '@unchainedshop/core';
import { emit, registerEvents } from '@unchainedshop/events';
import {
  generateDbMutations,
  generateDbFilterById,
  buildSortOptions,
  TimestampFields,
  mongodb,
} from '@unchainedshop/mongodb';
import { SortDirection, SortOption } from '@unchainedshop/utils';
import { systemLocale } from '@unchainedshop/utils';
import { LanguagesCollection } from '../db/LanguagesCollection.js';

export type Language = {
  _id?: string;
  isoCode: string;
  isActive?: boolean;
} & TimestampFields;

export type LanguageQuery = {
  includeInactive?: boolean;
  queryString?: string;
};

export interface LanguagesModule extends ModuleMutations<Language> {
  findLanguage: (params: { languageId?: string; isoCode?: string }) => Promise<Language>;
  findLanguages: (
    params: LanguageQuery & {
      limit?: number;
      offset?: number;
      sort?: Array<SortOption>;
    },
    options?: mongodb.FindOptions,
  ) => Promise<Array<Language>>;
  count: (query: LanguageQuery) => Promise<number>;
  languageExists: (params: { languageId: string }) => Promise<boolean>;

  isBase: (language: Language) => boolean;
}

const LANGUAGE_EVENTS: string[] = ['LANGUAGE_CREATE', 'LANGUAGE_UPDATE', 'LANGUAGE_REMOVE'];

export const buildFindSelector = ({ includeInactive = false, queryString }: LanguageQuery) => {
  const selector: { isActive?: true; deleted?: Date; $text?: any } = { deleted: null };
  if (!includeInactive) selector.isActive = true;
  if (queryString) {
    selector.$text = { $search: queryString };
  }
  return selector;
};

export const configureLanguagesModule = async ({
  db,
}: ModuleInput<Record<string, never>>): Promise<LanguagesModule> => {
  registerEvents(LANGUAGE_EVENTS);

  const Languages = await LanguagesCollection(db);

  const mutations = generateDbMutations<Language>(Languages) as ModuleMutations<Language>;

  return {
    findLanguage: async ({ languageId, isoCode }) => {
      return Languages.findOne(languageId ? generateDbFilterById(languageId) : { isoCode }, {});
    },

    findLanguages: async ({ limit, offset, sort, ...query }, options) => {
      const defaultSort = [{ key: 'created', value: SortDirection.ASC }] as SortOption[];
      return Languages.find(buildFindSelector(query), {
        skip: offset,
        limit,
        sort: buildSortOptions(sort || defaultSort),
        ...options,
      }).toArray();
    },

    count: async (query) => {
      const count = await Languages.countDocuments(buildFindSelector(query));
      return count;
    },

    languageExists: async ({ languageId }) => {
      const languageCount = await Languages.countDocuments(
        generateDbFilterById(languageId, { deleted: null }),
        {
          limit: 1,
        },
      );
      return !!languageCount;
    },

    isBase(language) {
      return language.isoCode === systemLocale.language;
    },

    create: async (doc: Language) => {
      await Languages.deleteOne({ isoCode: doc.isoCode.toLowerCase(), deleted: { $ne: null } });
      const languageId = await mutations.create({
        ...doc,
        isoCode: doc.isoCode.toLowerCase(),
        isActive: true,
      });
      await emit('LANGUAGE_CREATE', { languageId });
      return languageId;
    },
    update: async (languageId, doc) => {
      await mutations.update(languageId, {
        ...doc,
        isoCode: doc.isoCode.toLowerCase(),
      });
      await emit('LANGUAGE_UPDATE', { languageId });
      return languageId;
    },
    delete: async (languageId) => {
      const deletedCount = await mutations.delete(languageId);
      await emit('LANGUAGE_REMOVE', { languageId });
      return deletedCount;
    },
    deletePermanently: mutations.deletePermanently,
  };
};
