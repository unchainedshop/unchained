import { Context } from '@unchainedshop/types/api';
import { Country as CountryType } from '@unchainedshop/types/countries';

export interface CountryHelperTypes {
  flagEmoji: (country: CountryType, params: never, context: Context) => string;
  isBase: (country: CountryType, params: never, context: Context) => boolean;
  name: (
    country: CountryType,
    params: { forceLocale: string },
    context: Context
  ) => string;
}

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
