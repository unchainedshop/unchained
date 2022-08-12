import { ModuleInput, ModuleMutations } from '@unchainedshop/types/core';
import { LanguagesModule, Language, LanguageQuery } from '@unchainedshop/types/languages';
import { emit, registerEvents } from '@unchainedshop/events';
import {
  generateDbMutations,
  generateDbFilterById,
  systemLocale,
  buildSortOptions,
} from '@unchainedshop/utils';
import { LanguagesCollection } from '../db/LanguagesCollection';
import { LanguagesSchema } from '../db/LanguagesSchema';

const LANGUAGE_EVENTS: string[] = ['LANGUAGE_CREATE', 'LANGUAGE_UPDATE', 'LANGUAGE_REMOVE'];

const buildFindSelector = ({ includeInactive = false, queryString }: LanguageQuery) => {
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

  const mutations = generateDbMutations<Language>(
    Languages,
    LanguagesSchema,
  ) as ModuleMutations<Language>;

  return {
    findLanguage: async ({ languageId, isoCode }) => {
      return Languages.findOne(languageId ? generateDbFilterById(languageId) : { isoCode }, {});
    },

    findLanguages: async ({ limit, offset, sort, ...query }, options) => {
      return Languages.find(buildFindSelector(query), {
        skip: offset,
        limit,
        sort: buildSortOptions(sort),
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

    isBase: (language) => {
      return language.isoCode === systemLocale.language;
    },

    create: async (doc: Language, userId?: string) => {
      await Languages.deleteOne({ isoCode: doc.isoCode.toLowerCase(), deleted: { $ne: null } });
      const languageId = await mutations.create(
        {
          ...doc,
          isoCode: doc.isoCode.toLowerCase(),
          isActive: true,
        },
        userId,
      );
      emit('LANGUAGE_CREATE', { languageId });
      return languageId;
    },
    update: async (languageId, doc, userId) => {
      await mutations.update(
        languageId,
        {
          ...doc,
          isoCode: doc.isoCode.toLowerCase(),
        },
        userId,
      );
      emit('LANGUAGE_UPDATE', { languageId });
      return languageId;
    },
    delete: async (languageId, userId) => {
      const deletedCount = await mutations.delete(languageId, userId);
      emit('LANGUAGE_REMOVE', { languageId });
      return deletedCount;
    },
    deletePermanently: mutations.deletePermanently,
  };
};
