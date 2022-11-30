import { SortOption } from './api';
import { FindOptions, TimestampFields, _ID } from './common';
import { ModuleMutations } from './core';

export type Language = {
  _id?: _ID;
  isoCode: string;
  isActive?: boolean;
} & TimestampFields;

export type LanguageQuery = {
  includeInactive?: boolean;
  isBase?: boolean;
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
