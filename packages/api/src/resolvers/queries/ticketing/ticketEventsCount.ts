import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import { TicketingModuleNotFoundError } from '../../../errors.ts';
import { GATE_COOKIE_NAME } from '../../../gate-cookie.ts';

export default async function ticketEventsCount(
  root: never,
  {
    queryString,
    includeDrafts = true,
    onlyInvalidateable = false,
  }: {
    queryString?: string;
    includeDrafts?: boolean;
    onlyInvalidateable?: boolean;
  },
  context: Context,
) {
  const { modules, services, userId } = context;
  log(`query ticketEventsCount`, { userId });

  const passCode = context.getCookie?.(GATE_COOKIE_NAME);
  const ticketingServices = (context.services as any)?.ticketing;

  if (!userId && passCode) {
    if (!ticketingServices?.productIdsForPassCode) {
      throw new TicketingModuleNotFoundError({});
    }
    const productIds = await ticketingServices.productIdsForPassCode(passCode);
    if (!onlyInvalidateable) return productIds.length;

    let count = 0;
    for (const productId of productIds) {
      const tokens = await modules.warehousing.findTokens({ productId });
      const hasInvalidateable = await Promise.all(
        tokens.map((token) => services.warehousing.isTokenInvalidateable({ token })),
      );
      if (hasInvalidateable.some(Boolean)) count++;
    }
    return count;
  }

  if (onlyInvalidateable) {
    const products = await modules.products.findProducts({
      type: 'TOKENIZED_PRODUCT',
      queryString,
      includeDrafts,
    });
    let count = 0;
    for (const product of products) {
      const tokens = await modules.warehousing.findTokens({ productId: product._id });
      const hasInvalidateable = await Promise.all(
        tokens.map((token) => services.warehousing.isTokenInvalidateable({ token })),
      );
      if (hasInvalidateable.some(Boolean)) count++;
    }
    return count;
  }

  return modules.products.count({
    type: 'TOKENIZED_PRODUCT',
    queryString,
    includeDrafts,
  });
}
