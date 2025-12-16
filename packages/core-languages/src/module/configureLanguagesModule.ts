import { assertDocumentDBCompatMode, type ModuleInput } from '@unchainedshop/mongodb';
import { emit, registerEvents } from '@unchainedshop/events';
import {
  generateDbFilterById,
  buildSortOptions,
  mongodb,
  generateDbObjectId,
} from '@unchainedshop/mongodb';
import { SortDirection, type SortOption } from '@unchainedshop/utils';
import { systemLocale } from '@unchainedshop/utils';
import { type Language, LanguagesCollection } from '../db/LanguagesCollection.ts';

export interface LanguageQuery {
  includeInactive?: boolean;
  queryString?: string;
  isoCodes?: string[];
}

const LANGUAGE_EVENTS: string[] = ['LANGUAGE_CREATE', 'LANGUAGE_UPDATE', 'LANGUAGE_REMOVE'];

export const buildFindSelector = ({ includeInactive = false, queryString, isoCodes }: LanguageQuery) => {
  const selector: mongodb.Filter<Language> = { deleted: null };
  if (!includeInactive) selector.isActive = true;
  if (isoCodes) {
    selector.isoCode = { $in: isoCodes };
  }
  if (queryString) {
    assertDocumentDBCompatMode();
    selector.$text = { $search: queryString };
  }
  return selector;
};

export const configureLanguagesModule = async ({ db }: ModuleInput<Record<string, never>>) => {
  registerEvents(LANGUAGE_EVENTS);

  const Languages = await LanguagesCollection(db);

  return {
    findLanguage: async (params: { languageId: string } | { isoCode: string }) => {
      if ('languageId' in params) {
        return Languages.findOne(generateDbFilterById(params.languageId), {});
      }
      return Languages.findOne({ isoCode: params.isoCode }, {});
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
        sort?: SortOption[];
      },
      options?: mongodb.FindOptions,
    ): Promise<Language[]> => {
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

    create: async (
      doc: Omit<Language, '_id' | 'created'> & Pick<Partial<Language>, '_id' | 'created'>,
    ) => {
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

    update: async (languageId: string, doc: mongodb.UpdateFilter<Language>['$set']) => {
      const modifier = { ...doc };
      if (modifier?.isoCode) {
        modifier.isoCode = modifier.isoCode.toLowerCase();
      }
      await Languages.updateOne(generateDbFilterById(languageId), {
        $set: {
          updated: new Date(),
          ...modifier,
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
