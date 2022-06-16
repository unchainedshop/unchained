import { Context, Root } from '@unchainedshop/types/api';
import { SearchQuery } from '@unchainedshop/types/filters';
import { log } from '@unchainedshop/logger';
import { QueryStringRequiredError } from '../../../errors';

export default async function searchAssortments(root: Root, query: SearchQuery, context: Context) {
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
