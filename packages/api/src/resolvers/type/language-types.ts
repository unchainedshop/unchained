import { Language as LanguageType } from '@unchainedshop/types/languages.js';
import { Context } from '@unchainedshop/api';

export interface LanguageHelperTypes {
  isBase: (language: LanguageType, params: never, context: Context) => boolean;
  name: (language: LanguageType, params: never, context: Context) => string;
}

export const Language: LanguageHelperTypes = {
  isBase(language, _, { modules }) {
    return modules.languages.isBase(language);
  },
  name(language, _, { modules }) {
    return `${language.isoCode}${modules.languages.isBase(language) ? ' (Base)' : ''}`;
  },
};
