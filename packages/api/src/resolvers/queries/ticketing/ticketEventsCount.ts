import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import { TicketingModuleNotFoundError } from '../../../errors.ts';

export default async function ticketEventsCount(
  root: never,
  {
    queryString,
    includeDrafts = true,
  }: {
    queryString?: string;
    includeDrafts?: boolean;
  },
  context: Context,
) {
  const { modules, userId } = context;
  log(`query ticketEventsCount`, { userId });

  const passCode = context.getHeader('x-passcode') as string;
  const ticketingServices = (context.services as any)?.ticketing;

  if (!userId && passCode) {
    if (!ticketingServices?.productIdsForPassCode) {
      throw new TicketingModuleNotFoundError({});
    }
    const productIds = await ticketingServices.productIdsForPassCode(passCode);
    return productIds.length;
  }

  return modules.products.count({
    type: 'TOKENIZED_PRODUCT',
    contractStandard: 'ERC721',
    queryString,
    includeDrafts,
  });
}
