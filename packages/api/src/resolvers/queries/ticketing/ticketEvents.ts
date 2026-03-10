import { log } from '@unchainedshop/logger';
import type { SortOption } from '@unchainedshop/utils';
import type { Context } from '../../../context.ts';

export default async function ticketEvents(
  root: never,
  {
    queryString,
    limit = 50,
    offset = 0,
    includeDrafts = true,
    sort,
  }: {
    queryString?: string;
    limit: number;
    offset: number;
    includeDrafts?: boolean;
    sort?: SortOption[];
  },
  { modules, userId }: Context,
) {
  log(`query ticketEvents`, { userId });

  return modules.products.findProducts({
    type: 'TOKENIZED_PRODUCT',
    queryString,
    includeDrafts,
    limit,
    offset,
    sort,
  });
}
