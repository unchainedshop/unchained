import { Context } from '../../../types.js';
import { SearchQuery } from '@unchainedshop/types/filters.js';
import { log } from '@unchainedshop/logger';
import { QueryStringRequiredError } from '../../../errors.js';

export default async function searchAssortments(root: never, query: SearchQuery, context: Context) {
  const { modules, userId } = context;
  const forceLiveCollection = false;

  log(`query search assortments ${JSON.stringify(query)}`, { userId });

  if (!query.queryString && !query.assortmentIds?.length) throw new QueryStringRequiredError({});

  return modules.filters.search.searchAssortments(
    query,
    {
      forceLiveCollection,
    },
    context,
  );
}
