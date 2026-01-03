import type { Modules } from '../modules.ts';
import { SearchDirector, SearchEntityType } from '../directors/index.ts';
import type { TokenQuery } from '@unchainedshop/core-warehousing';

export async function searchTokensService(
  this: Modules,
  queryString?: string,
  query: TokenQuery = {},
  options: { limit?: number; skip?: number } = {},
) {
  if (!queryString) {
    return this.warehousing.findTokens(query, options);
  }

  const searchActions = SearchDirector.actions({ queryString }, { modules: this });
  const searchTokenIds = await searchActions.search(SearchEntityType.TOKEN_SURROGATE);
  if (searchTokenIds.length === 0) return [];

  return this.warehousing.findTokens({ ...query, searchTokenIds }, options);
}

export async function searchTokensCountService(
  this: Modules,
  queryString?: string,
  query: TokenQuery = {},
) {
  if (!queryString) {
    return this.warehousing.tokensCount(query);
  }

  const searchActions = SearchDirector.actions({ queryString }, { modules: this });
  const searchTokenIds = await searchActions.search(SearchEntityType.TOKEN_SURROGATE);
  if (searchTokenIds.length === 0) return 0;

  return this.warehousing.tokensCount({ ...query, searchTokenIds });
}
