import { log } from '@unchainedshop/logger';
import type { SortOption } from '@unchainedshop/utils';
import type { Context } from '../../../context.ts';
import { TicketingModuleNotFoundError } from '../../../errors.ts';
import { GATE_COOKIE_NAME } from '../../../gate-cookie.ts';

export default async function ticketEvents(
  root: never,
  {
    queryString,
    limit = 50,
    offset = 0,
    includeDrafts = true,
    sort,
    onlyInvalidateable = false,
  }: {
    queryString?: string;
    limit: number;
    offset: number;
    includeDrafts?: boolean;
    sort?: SortOption[];
    onlyInvalidateable?: boolean;
  },
  context: Context,
) {
  const { modules, services, userId } = context;
  log(`query ticketEvents`, { userId });

  const passCode = context.getCookie?.(GATE_COOKIE_NAME);
  const ticketingServices = (context.services as any)?.ticketing;

  let products;

  if (!userId && passCode) {
    if (!ticketingServices?.productIdsForPassCode) {
      throw new TicketingModuleNotFoundError({});
    }
    const productIds = await ticketingServices.productIdsForPassCode(passCode);
    if (!productIds.length) return [];

    const allProducts = await modules.products.findProducts({
      type: 'TOKENIZED_PRODUCT',
      queryString,
      includeDrafts: false,
      limit,
      offset,
      sort,
    });

    products = allProducts.filter((p) => productIds.includes(p._id));
  } else {
    products = await modules.products.findProducts({
      type: 'TOKENIZED_PRODUCT',
      queryString,
      includeDrafts,
      limit,
      offset,
      sort,
    });
  }

  if (onlyInvalidateable) {
    const filtered = await Promise.all(
      products.map(async (product) => {
        const tokens = await modules.warehousing.findTokens({ productId: product._id });
        const hasInvalidateable = await Promise.all(
          tokens.map((token) => services.warehousing.isTokenInvalidateable({ token })),
        );
        return hasInvalidateable.some(Boolean) ? product : null;
      }),
    );
    return filtered.filter(Boolean);
  }

  return products;
}
