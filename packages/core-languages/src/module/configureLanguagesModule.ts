import { ModuleInput, ModuleMutations } from '@unchainedshop/types/core.js';
import { LanguagesModule, Language, LanguageQuery } from '@unchainedshop/types/languages.js';
import { emit, registerEvents } from '@unchainedshop/events';
import { generateDbMutations, generateDbFilterById, buildSortOptions } from '@unchainedshop/mongodb';
import { SortDirection, SortOption } from '@unchainedshop/utils';
import { systemLocale } from '@unchainedshop/utils';
import { LanguagesCollection } from '../db/LanguagesCollection.js';
import { LanguagesSchema } from '../db/LanguagesSchema.js';

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

  const mutations = generateDbMutations<Language>(
    Languages,
    LanguagesSchema,
  ) as ModuleMutations<Language>;

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
