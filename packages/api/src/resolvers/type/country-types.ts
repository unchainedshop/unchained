import { Context } from '@unchainedshop/api';
import { Country as CountryType } from '@unchainedshop/types/countries.js';
import { Currency } from '@unchainedshop/types/currencies.js';

export type HelperType<P, T> = (country: CountryType, params: P, context: Context) => T;

export interface CountryHelperTypes {
  flagEmoji: HelperType<never, string>;
  isBase: HelperType<never, boolean>;
  name: HelperType<{ forceLocale: string }, string>;
  defaultCurrency: HelperType<never, Promise<Currency>>;
}

export const Country: CountryHelperTypes = {
  defaultCurrency: async (country, _, { modules }) => {
    if (country.defaultCurrencyCode) {
      return modules.currencies.findCurrency({
        isoCode: country.defaultCurrencyCode,
      });
    }
    return null;
  },

  flagEmoji: (country, _, { modules }: Context) => {
    return modules.countries.flagEmoji(country);
  },
  isBase: (country, _, { modules }: Context) => {
    return modules.countries.isBase(country);
  },
  name: (country, { forceLocale }, { localeContext, modules }) => {
    return modules.countries.name(country, forceLocale || localeContext.language);
  },
};
