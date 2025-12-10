import type { Context } from '../../../context.ts';
import type { SearchQuery } from '@unchainedshop/core-filters';
import { log } from '@unchainedshop/logger';

export default async function searchAssortments(root: never, query: SearchQuery, context: Context) {
  const { services, userId, locale } = context;

  log(`query search assortments ${JSON.stringify(query)}`, { userId });

  return services.filters.searchAssortments(query, {
    locale,
  });
}
