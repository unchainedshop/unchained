import { SortOption } from './api';
import { TimestampFields, _ID } from './common';
import { ModuleMutations } from './core';

export type Currency = {
  _id?: _ID;
  isoCode: string;
  isActive: boolean;
  authorId: string;
  contractAddress?: string;
} & TimestampFields;

export type CurrencyQuery = {
  includeInactive?: boolean;
  contractAddress?: string;
  queryString?: string;
};
export type CurrenciesModule = ModuleMutations<Currency> & {
  findCurrency: (params: { currencyId?: string; isoCode?: string }) => Promise<Currency>;
  findCurrencies: (
    params: CurrencyQuery & {
      limit?: number;
      offset?: number;
      sort?: Array<SortOption>;
    },
  ) => Promise<Array<Currency>>;
  count: (query: CurrencyQuery) => Promise<number>;
  currencyExists: (params: { currencyId: string }) => Promise<boolean>;
};
