import { WithId } from 'mongodb';
import { SortOption } from './api';
import { FindOptions, TimestampFields, _ID } from './common';
import { ModuleMutations, UnchainedCore } from './core';

export type Country = {
  _id?: _ID;
  isoCode: string;
  isActive?: boolean;
  defaultCurrencyId?: string;
} & TimestampFields;

export type CountryQuery = {
  includeInactive?: boolean;
  queryString?: string;
};
export type CountriesModule = ModuleMutations<Country> & {
  findCountry: (params: { countryId?: string; isoCode?: string }) => Promise<WithId<Country> | null>;
  findCountries: (
    params: CountryQuery & {
      limit?: number;
      offset?: number;
      sort?: Array<SortOption>;
    },
    options?: FindOptions,
  ) => Promise<Array<Country>>;
  count: (query: CountryQuery) => Promise<number>;
  countryExists: (params: { countryId: string }) => Promise<boolean>;

  flagEmoji: (country: Country) => string;
  isBase: (country: Country) => boolean;
  name: (country: Country, language: string) => string;
};

export type ResolveDefaultCurrencyCodeService = (
  params: { isoCode: string },
  unchainedAPI: UnchainedCore,
) => Promise<string>;

export interface CountryServices {
  resolveDefaultCurrencyCode: ResolveDefaultCurrencyCodeService;
}
