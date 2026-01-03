import type { Modules } from '../modules.ts';
import { SearchDirector } from '../directors/index.ts';
import type { CountryQuery } from '@unchainedshop/core-countries';

export async function searchCountriesService(
  this: Modules,
  queryString?: string,
  query: CountryQuery = {},
) {
  if (!queryString) {
    return this.countries.findCountries(query);
  }

  const searchActions = SearchDirector.actions({ queryString }, { modules: this });
  const searchCountryIds = await searchActions.search('countries');
  if (searchCountryIds.length === 0) return [];

  return this.countries.findCountries({ ...query, searchCountryIds });
}

export async function searchCountriesCountService(
  this: Modules,
  queryString?: string,
  query: CountryQuery = {},
) {
  if (!queryString) {
    return this.countries.count(query);
  }

  const searchActions = SearchDirector.actions({ queryString }, { modules: this });
  const searchCountryIds = await searchActions.search('countries');
  if (searchCountryIds.length === 0) return 0;

  return this.countries.count({ ...query, searchCountryIds });
}
