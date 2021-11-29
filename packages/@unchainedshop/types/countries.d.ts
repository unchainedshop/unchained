import {
  ModuleMutations,
  Query,
  TimestampFields,
  _ID,
} from '@unchainedshop/types/common';

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
    }
  ) => Promise<Array<Country>>;
  count: (query: CountryQuery) => Promise<number>;
  countryExists: (params: { countryId: string }) => Promise<boolean>;

  flagEmoji: () => string;
  isBase: () => boolean;
  name: (language: string) => string;
};
