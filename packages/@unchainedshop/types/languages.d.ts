import { Context } from './api';
import { ModuleMutations, TimestampFields, _ID } from './common';

export type Language = {
  _id?: _ID;
  isoCode: string;
  isActive?: boolean;
  authorId: string;
} & TimestampFields;

type LanguageQuery = {
  includeInactive?: boolean;
};

export interface LanguagesModule extends ModuleMutations<Language> {
  findLanguage: (params: {
    languageId?: string;
    isoCode?: string;
  }) => Promise<Language>;
  findLanguages: (
    params: LanguageQuery & {
      limit?: number;
      offset?: number;
    }
  ) => Promise<Array<Language>>;
  count: (query: LanguageQuery) => Promise<number>;
  languageExists: (params: { languageId: string }) => Promise<boolean>;

  isBase: (language: Language) => boolean;
}

export interface LanguageHelperTypes {
  isBase: (language: Language, params: never, context: Context) => boolean;
  name: (language: Language, params: never, context: Context) => string;
}
