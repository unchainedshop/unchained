import type { FindOptions } from 'mongodb';
import { SortOption } from '@unchainedshop/utils';
import { ModuleMutations } from './core.js';
import type { TimestampFields } from '@unchainedshop/mongodb';

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
    options?: FindOptions,
  ) => Promise<Array<Language>>;
  count: (query: LanguageQuery) => Promise<number>;
  languageExists: (params: { languageId: string }) => Promise<boolean>;

  isBase: (language: Language) => boolean;
}
