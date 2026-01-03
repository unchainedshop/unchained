import type { Modules } from '../modules.ts';
import { SearchDirector } from '../directors/index.ts';
import type { LanguageQuery } from '@unchainedshop/core-languages';

export async function searchLanguagesService(
  this: Modules,
  queryString?: string,
  query: LanguageQuery = {},
) {
  if (!queryString) {
    return this.languages.findLanguages(query);
  }

  const searchActions = SearchDirector.actions({ queryString }, { modules: this });
  const searchLanguageIds = await searchActions.search('languages');
  if (searchLanguageIds.length === 0) return [];

  return this.languages.findLanguages({ ...query, searchLanguageIds });
}

export async function searchLanguagesCountService(
  this: Modules,
  queryString?: string,
  query: LanguageQuery = {},
) {
  if (!queryString) {
    return this.languages.count(query);
  }

  const searchActions = SearchDirector.actions({ queryString }, { modules: this });
  const searchLanguageIds = await searchActions.search('languages');
  if (searchLanguageIds.length === 0) return 0;

  return this.languages.count({ ...query, searchLanguageIds });
}
