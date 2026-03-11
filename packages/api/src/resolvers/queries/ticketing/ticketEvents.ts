import { log } from '@unchainedshop/logger';
import type { SortOption } from '@unchainedshop/utils';
import type { Context } from '../../../context.ts';
import { TicketingModuleNotFoundError } from '../../../errors.ts';

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
  context: Context,
) {
  const { modules, userId } = context;
  log(`query ticketEvents`, { userId });

  const passCode = context.getHeader('x-passcode') as string;
  const ticketingServices = (context.services as any)?.ticketing;

  if (!userId && passCode) {
    if (!ticketingServices?.productIdsForPassCode) {
      throw new TicketingModuleNotFoundError({});
    }
    const productIds = await ticketingServices.productIdsForPassCode(passCode);
    if (!productIds.length) return [];

    const products = await modules.products.findProducts({
      type: 'TOKENIZED_PRODUCT',
      queryString,
      includeDrafts: false,
      limit,
      offset,
      sort,
    });

    return products.filter((p) => productIds.includes(p._id));
  }

  return modules.products.findProducts({
    type: 'TOKENIZED_PRODUCT',
    queryString,
    includeDrafts,
    limit,
    offset,
    sort,
  });
}
