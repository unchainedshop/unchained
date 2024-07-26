import { SortOption } from '@unchainedshop/utils';
import { ModuleMutations } from './core.js';
import type { TimestampFields } from '@unchainedshop/mongodb';

export type Currency = {
  _id?: string;
  isoCode: string;
  isActive: boolean;
  contractAddress?: string;
  decimals?: number;
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
