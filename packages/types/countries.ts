import type { FindOptions } from 'mongodb';
import { SortOption } from './api.js';
import { TimestampFields } from './common.js';
import { ModuleMutations, UnchainedCore } from './core.js';

export type Country = {
  _id?: string;
  isoCode: string;
  isActive?: boolean;
  defaultCurrencyId?: string;
} & TimestampFields;

export type CountryQuery = {
  includeInactive?: boolean;
  queryString?: string;
};
export type CountriesModule = ModuleMutations<Country> & {
  findCountry: (params: { countryId?: string; isoCode?: string }) => Promise<Country>;
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
