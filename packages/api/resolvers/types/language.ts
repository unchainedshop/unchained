import { LanguageHelperTypes } from '@unchainedshop/types/languages';

const languageTypes: LanguageHelperTypes = {
  isBase(language, _, { modules }) {
    return modules.languages.isBase(language);
  },
  name(language, _, { modules }) {
    return `${language.isoCode}${
      modules.languages.isBase(language) ? ' (Base)' : ''
    }`;
  },
};

export default languageTypes;
