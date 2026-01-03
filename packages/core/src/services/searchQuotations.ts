import type { Modules } from '../modules.ts';
import { SearchDirector } from '../directors/index.ts';
import type { QuotationQuery } from '@unchainedshop/core-quotations';

export async function searchQuotationsService(
  this: Modules,
  queryString?: string,
  query: QuotationQuery = {},
  options: { locale?: Intl.Locale; userId?: string } = {},
) {
  if (!queryString) {
    return this.quotations.findQuotations(query);
  }

  const searchActions = SearchDirector.actions(
    { queryString, locale: options.locale, userId: options.userId },
    { modules: this },
  );
  const searchQuotationIds = await searchActions.searchQuotations();
  if (searchQuotationIds.length === 0) return [];

  return this.quotations.findQuotations({ ...query, searchQuotationIds });
}
