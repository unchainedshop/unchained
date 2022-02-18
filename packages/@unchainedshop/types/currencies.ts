import { ModuleMutations, TimestampFields, _ID } from './common';

export type Currency = {
  _id?: _ID;
  isoCode: string;
  isActive: boolean;
  authorId: string;
  contractAddress: string;
} & TimestampFields;

type CurrencyQuery = {
  includeInactive?: boolean;
  contractAddress?: string;
};
export type CurrenciesModule = ModuleMutations<Currency> & {
  findCurrency: (params: { currencyId?: string; isoCode?: string }) => Promise<Currency>;
  findCurrencies: (
    params: CurrencyQuery & {
      limit?: number;
      offset?: number;
    },
  ) => Promise<Array<Currency>>;
  count: (query: CurrencyQuery) => Promise<number>;
  currencyExists: (params: { currencyId: string }) => Promise<boolean>;
};
