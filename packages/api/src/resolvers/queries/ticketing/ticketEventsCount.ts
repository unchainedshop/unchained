import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';

export default async function ticketEventsCount(
  root: never,
  {
    queryString,
    includeDrafts = true,
  }: {
    queryString?: string;
    includeDrafts?: boolean;
  },
  { modules, userId }: Context,
) {
  log(`query ticketEventsCount`, { userId });

  return modules.products.count({
    type: 'TOKENIZED_PRODUCT',
    contractStandard: 'ERC721',
    queryString,
    includeDrafts,
  });
}
