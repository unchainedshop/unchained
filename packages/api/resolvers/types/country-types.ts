import { Context } from '@unchainedshop/types/api';
import { Country as CountryType } from '@unchainedshop/types/countries';
import { Currency } from '@unchainedshop/types/currencies';

type HelperType<P, T> = (
  country: CountryType,
  params: P,
  context: Context
) => T;

export interface CountryHelperTypes {
  flagEmoji: HelperType<never, string>;
  isBase: HelperType<never, boolean>;
  name: HelperType<{ forceLocale: string }, string>;
  defaultCurrency: HelperType<never, Promise<Currency>>;
}

export const Country: CountryHelperTypes = {
  defaultCurrency: async (country, _, { modules }) => {
    if (country.defaultCurrencyId) {
      return modules.currencies.findCurrency({ currencyId: country.defaultCurrencyId });
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
    return modules.countries.name(
      country,
      forceLocale || localeContext.language
    );
  },
};
