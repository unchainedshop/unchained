import { Language as LanguageType } from '@unchainedshop/core-languages';
import { Context } from '../../context.js';

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
