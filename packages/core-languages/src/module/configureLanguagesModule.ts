import { ModuleInput } from '@unchainedshop/types/common';
import { LanguagesModule, Language } from '@unchainedshop/types/languages';
import { emit, registerEvents } from 'meteor/unchained:events';
import { generateDbMutations, generateDbFilterById } from 'meteor/unchained:utils';
import { LanguagesCollection } from '../db/LanguagesCollection';
import { LanguagesSchema } from '../db/LanguagesSchema';
import { systemLocale } from 'meteor/unchained:utils';

const LANGUAGE_EVENTS: string[] = [
  'LANGUAGE_CREATE',
  'LANGUAGE_UPDATE',
  'LANGUAGE_REMOVE',
];

type FindQuery = {
  includeInactive?: boolean;
};
const buildFindSelector = ({ includeInactive = false }: FindQuery) => {
  const selector: { isActive?: true } = {};
  if (!includeInactive) selector.isActive = true;
  return selector;
};

export const configureLanguagesModule = async ({
  db,
}: ModuleInput<{}>): Promise<LanguagesModule> => {
  registerEvents(LANGUAGE_EVENTS);

  const Languages = await LanguagesCollection(db);

  const mutations = generateDbMutations<Language>(Languages, LanguagesSchema);

  return {
    findLanguage: async ({ languageId, isoCode }) => {
      return await Languages.findOne(
        languageId ? generateDbFilterById(languageId) : { isoCode }
      );
    },

    findLanguages: async ({ limit, offset, includeInactive }, options) => {
      const languages = Languages.find(
        buildFindSelector({ includeInactive }),
        {
          skip: offset,
          limit,
          ...options,
        }
      );
      return await languages.toArray();
    },

    count: async (query) => {
      const count = await Languages.find(buildFindSelector(query)).count();
      return count;
    },

    languageExists: async ({ languageId }) => {
      const languageCount = await Languages.find(
        { _id: languageId },
        { limit: 1 }
      ).count();
      return !!languageCount;
    },

    isBase: (language) => {
      return language.isoCode === systemLocale.language;
    },

    create: async (doc: Language, userId?: string) => {
      const languageId = await mutations.create(doc, userId);
      emit('LANGUAGE_CREATE', { languageId });
      return languageId;
    },
    update: async (_id: string, doc: Language, userId?: string) => {
      const languageId = await mutations.update(_id, doc, userId);
      emit('LANGUAGE_UPDATE', { languageId });
      return languageId;
    },
    delete: async (languageId) => {
      const deletedCount = await mutations.delete(languageId);
      emit('LANGUAGE_REMOVE', { languageId });
      return deletedCount;
    },
  };
};
