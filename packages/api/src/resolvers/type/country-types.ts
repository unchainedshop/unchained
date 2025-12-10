import type { Context } from '../../context.ts';
import type { Country as CountryType } from '@unchainedshop/core-countries';
import type { Currency } from '@unchainedshop/core-currencies';

export type HelperType<P, T> = (country: CountryType, params: P, context: Context) => T;

export interface CountryHelperTypes {
  flagEmoji: HelperType<never, string>;
  isBase: HelperType<never, boolean>;
  name: HelperType<{ forceLocale?: string }, string | undefined>;
  defaultCurrency: HelperType<never, Promise<Currency | null>>;
}

export const Country: CountryHelperTypes = {
  defaultCurrency: async (country, _, { loaders }) => {
    if (country.defaultCurrencyCode) {
      return loaders.currencyLoader.load({ isoCode: country.defaultCurrencyCode });
    }
    return null;
  },

  flagEmoji: (country, _, { modules }: Context) => {
    return modules.countries.flagEmoji(country);
  },
  isBase: (country, _, { modules }: Context) => {
    return modules.countries.isBase(country);
  },
  name: (country, { forceLocale }, { locale, modules }) => {
    return modules.countries.name(country, forceLocale ? new Intl.Locale(forceLocale) : locale);
  },
};
