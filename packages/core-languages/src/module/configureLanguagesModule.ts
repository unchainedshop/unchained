import { ModuleInput } from '@unchainedshop/mongodb';
import { emit, registerEvents } from '@unchainedshop/events';
import {
  generateDbFilterById,
  buildSortOptions,
  mongodb,
  generateDbObjectId,
} from '@unchainedshop/mongodb';
import { SortDirection, SortOption } from '@unchainedshop/utils';
import { systemLocale } from '@unchainedshop/utils';
import { Language, LanguagesCollection } from '../db/LanguagesCollection.js';
import { UpdateFilter } from 'mongodb';

export type LanguageQuery = mongodb.Filter<Language> & {
  includeInactive?: boolean;
  queryString?: string;
};

const LANGUAGE_EVENTS: string[] = ['LANGUAGE_CREATE', 'LANGUAGE_UPDATE', 'LANGUAGE_REMOVE'];

export const buildFindSelector = ({ includeInactive = false, queryString, ...rest }: LanguageQuery) => {
  const selector: mongodb.Filter<Language> = { deleted: null, ...rest };
  if (!includeInactive) selector.isActive = true;
  if (queryString) {
    selector.$text = { $search: queryString };
  }
  return selector;
};

export const configureLanguagesModule = async ({ db }: ModuleInput<Record<string, never>>) => {
  registerEvents(LANGUAGE_EVENTS);

  const Languages = await LanguagesCollection(db);

  return {
    findLanguage: async ({
      languageId,
      isoCode,
    }: {
      languageId?: string;
      isoCode?: string;
    }): Promise<Language> => {
      return Languages.findOne(languageId ? generateDbFilterById(languageId) : { isoCode }, {});
    },

    findLanguages: async (
      {
        limit,
        offset,
        sort,
        ...query
      }: LanguageQuery & {
        limit?: number;
        offset?: number;
        sort?: Array<SortOption>;
      },
      options?: mongodb.FindOptions,
    ): Promise<Array<Language>> => {
      const defaultSort = [{ key: 'created', value: SortDirection.ASC }] as SortOption[];
      return Languages.find(buildFindSelector(query), {
        skip: offset,
        limit,
        sort: buildSortOptions(sort || defaultSort),
        ...options,
      }).toArray();
    },

    count: async (query: LanguageQuery): Promise<number> => {
      const count = await Languages.countDocuments(buildFindSelector(query));
      return count;
    },

    languageExists: async ({ languageId }: { languageId: string }): Promise<boolean> => {
      const languageCount = await Languages.countDocuments(
        generateDbFilterById(languageId, { deleted: null }),
        {
          limit: 1,
        },
      );
      return !!languageCount;
    },

    isBase(language: Language): boolean {
      return language.isoCode === systemLocale.language;
    },

    create: async (doc: Language) => {
      await Languages.deleteOne({ isoCode: doc.isoCode.toLowerCase(), deleted: { $ne: null } });
      const { insertedId: languageId } = await Languages.insertOne({
        _id: generateDbObjectId(),
        created: new Date(),
        ...doc,
        isoCode: doc.isoCode.toLowerCase(),
        isActive: true,
      });
      await emit('LANGUAGE_CREATE', { languageId });
      return languageId;
    },

    update: async (languageId: string, doc: UpdateFilter<Language>['$set']) => {
      await Languages.updateOne(generateDbFilterById(languageId), {
        $set: {
          updated: new Date(),
          ...doc,
          isoCode: doc.isoCode.toLowerCase(),
        },
      });
      await emit('LANGUAGE_UPDATE', { languageId });
      return languageId;
    },

    delete: async (languageId: string) => {
      const { modifiedCount: deletedCount } = await Languages.updateOne(
        generateDbFilterById(languageId),
        {
          $set: {
            deleted: new Date(),
          },
        },
      );
      await emit('LANGUAGE_REMOVE', { languageId });
      return deletedCount;
    },
  };
};

export type LanguagesModule = Awaited<ReturnType<typeof configureLanguagesModule>>;
