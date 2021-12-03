import { LanguageHelperTypes } from "@unchainedshop/types/languages";

export const Language: LanguageHelperTypes = {
  isBase(language, _, { modules }) {
    return modules.languages.isBase(language);
  },
  name(language, _, { modules }) {
    return `${language.isoCode}${
      modules.languages.isBase(language) ? ' (Base)' : ''
    }`;
  },
};
