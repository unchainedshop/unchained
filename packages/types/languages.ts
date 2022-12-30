import { SortOption } from './api.js';
import { FindOptions, TimestampFields, _ID } from './common.js';
import { ModuleMutations } from './core.js';

export type Language = {
  _id?: _ID;
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
