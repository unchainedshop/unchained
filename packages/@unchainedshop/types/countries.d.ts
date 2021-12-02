import { Context } from './api';
import { FindOptions, ModuleMutations, TimestampFields, _ID } from './common';

export type Country = {
  _id?: _ID;
  isoCode: string;
  isActive?: boolean;
  authorId: string;
  defaultCurrencyId?: string;
} & TimestampFields;

type CountryQuery = {
  includeInactive?: boolean;
};
export type CountriesModule = ModuleMutations<Country> & {
  findCountry: (params: {
    countryId?: string;
    isoCode?: string;
  }) => Promise<Country>;
  findCountries: (
    params: CountryQuery & {
      limit?: number;
      offset?: number;
    },
    options?: FindOptions
  ) => Promise<Array<Country>>;
  count: (query: CountryQuery) => Promise<number>;
  countryExists: (params: { countryId: string }) => Promise<boolean>;

  flagEmoji: (country: Country) => string;
  isBase: (country: Country) => boolean;
  name: (country: Country, language: string) => string;
};

export interface CountryHelperTypes {
  flagEmoji: (country: Country, params: never, context: Context) => string;
  isBase: (country: Country, params: never, context: Context) => boolean;
  name: (
    country: Country,
    params: { forceLocale: string },
    context: Context
  ) => string;
}
