import { FindOptions, ModuleMutations, TimestampFields, _ID } from './common';

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
  findLanguage: (params: { languageId?: string; isoCode?: string }) => Promise<Language>;
  findLanguages: (
    params: LanguageQuery & {
      limit?: number;
      offset?: number;
    },
    options?: FindOptions,
  ) => Promise<Array<Language>>;
  count: (query: LanguageQuery) => Promise<number>;
  languageExists: (params: { languageId: string }) => Promise<boolean>;

  isBase: (language: Language) => boolean;
}
