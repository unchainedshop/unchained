import type { Modules } from '../modules.ts';
import { SearchDirector, SearchEntityType } from '../directors/index.ts';
import type { CurrencyQuery } from '@unchainedshop/core-currencies';

export async function searchCurrenciesService(
  this: Modules,
  queryString?: string,
  query: CurrencyQuery = {},
) {
  if (!queryString) {
    return this.currencies.findCurrencies(query);
  }

  const searchActions = SearchDirector.actions({ queryString }, { modules: this });
  const searchCurrencyIds = await searchActions.search(SearchEntityType.CURRENCY);
  if (searchCurrencyIds.length === 0) return [];

  return this.currencies.findCurrencies({ ...query, searchCurrencyIds });
}

export async function searchCurrenciesCountService(
  this: Modules,
  queryString?: string,
  query: CurrencyQuery = {},
) {
  if (!queryString) {
    return this.currencies.count(query);
  }

  const searchActions = SearchDirector.actions({ queryString }, { modules: this });
  const searchCurrencyIds = await searchActions.search(SearchEntityType.CURRENCY);
  if (searchCurrencyIds.length === 0) return 0;

  return this.currencies.count({ ...query, searchCurrencyIds });
}
