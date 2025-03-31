import { Context } from '../../../context.js';
import { SearchQuery } from '@unchainedshop/core-filters';
import { log } from '@unchainedshop/logger';
import { QueryStringRequiredError } from '../../../errors.js';

export default async function searchAssortments(root: never, query: SearchQuery, context: Context) {
  const { services, userId, localeContext } = context;
  const forceLiveCollection = false;

  log(`query search assortments ${JSON.stringify(query)}`, { userId });

  if (!query.queryString && !query.assortmentIds?.length) throw new QueryStringRequiredError({});

  return services.filters.searchAssortments(query, {
    forceLiveCollection,
    locale: localeContext,
  });
}
