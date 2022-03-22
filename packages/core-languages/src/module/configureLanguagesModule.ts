import { ModuleInput } from '@unchainedshop/types/common';
import { LanguagesModule, Language } from '@unchainedshop/types/languages';
import { emit, registerEvents } from 'meteor/unchained:events';
import { generateDbMutations, generateDbFilterById, systemLocale } from 'meteor/unchained:utils';
import { LanguagesCollection } from '../db/LanguagesCollection';
import { LanguagesSchema } from '../db/LanguagesSchema';

const LANGUAGE_EVENTS: string[] = ['LANGUAGE_CREATE', 'LANGUAGE_UPDATE', 'LANGUAGE_REMOVE'];

type FindQuery = {
  includeInactive?: boolean;
};
const buildFindSelector = ({ includeInactive = false }: FindQuery) => {
  const selector: { isActive?: true } = { deleted: null };
  if (!includeInactive) selector.isActive = true;
  return selector;
};

export const configureLanguagesModule = async ({
  db,
}: ModuleInput<Record<string, never>>): Promise<LanguagesModule> => {
  registerEvents(LANGUAGE_EVENTS);

  const Languages = await LanguagesCollection(db);

  const mutations = generateDbMutations<Language>(Languages, LanguagesSchema);

  return {
    findLanguage: async ({ languageId, isoCode }) => {
      return Languages.findOne(languageId ? generateDbFilterById(languageId) : { isoCode });
    },

    findLanguages: async ({ limit, offset, includeInactive }, options) => {
      return Languages.find(buildFindSelector({ includeInactive }), {
        skip: offset,
        limit,
        ...options,
      }).toArray();
    },

    count: async (query) => {
      const count = await Languages.find(buildFindSelector(query)).count();
      return count;
    },

    languageExists: async ({ languageId }) => {
      const languageCount = await Languages.find(generateDbFilterById(languageId, { deleted: null }), {
        limit: 1,
      }).count();
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
  };
};
