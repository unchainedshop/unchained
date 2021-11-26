import { ModuleMutations, Query, TimestampFields, _ID } from './common';

type UserProductFilter = {
  userId: string;
  productId: string;
};

export type Currency = {
  _id?: _ID;
  isoCode: string;
  isActive: boolean;
  authorId: string;
} & TimestampFields;

export declare interface CurrenciesModule extends ModuleMutations<Currency> {
  findCurrency: (params: {
    currencyId?: string;
    isoCode?: string;
  }) => Promise<Currency>;
  findCurrencies: (params: Query & {
    limit?: number;
    offset?: number;
    includeInactive?: boolean;
  }) => Promise<Array<Currency>>;
  count: (query: Query) => Promise<number>;
  currencyExists: (params: { currencyId: string }) => Promise<boolean>;
}
