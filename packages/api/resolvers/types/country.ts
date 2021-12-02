import { Context } from '@unchainedshop/types/api';
import { CountryHelperTypes } from '@unchainedshop/types/countries';

export const Country: CountryHelperTypes = {
  flagEmoji(country, _, { modules }: Context) {
    return modules.countries.flagEmoji(country);
  },
  isBase(country, _, { modules }: Context) {
    return modules.countries.isBase(country);
  },
  name(country, { forceLocale }, { localeContext, modules }: Context) {
    return modules.countries.name(
      country,
      forceLocale || localeContext.language
    );
  },
};
