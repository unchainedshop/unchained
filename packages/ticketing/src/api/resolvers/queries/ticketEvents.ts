import { log } from '@unchainedshop/logger';
import type { SortOption } from '@unchainedshop/utils';
import type { Context } from '@unchainedshop/api';
import { ProductType, type Product } from '@unchainedshop/core-products';
import { resolveTicketingAccess } from '../../roles.ts';

export interface TicketEventQuery {
  queryString?: string;
  includeDrafts?: boolean;
  onlyInvalidateable?: boolean;
}

export async function buildTicketEventQuery(
  { queryString, includeDrafts = true }: TicketEventQuery,
  context: Context,
) {
  const access = await resolveTicketingAccess(context);
  return {
    type: ProductType.TOKENIZED_PRODUCT,
    queryString,
    includeDrafts: Boolean(access?.includeDrafts && includeDrafts),
  };
}

// Tickets are checked in bounded batches and the scan stops at the first redeemable one,
// so events whose tickets are mostly redeemed stay cheap to list.
const REDEEMABLE_CHECK_BATCH = 20;

async function hasRedeemableTicket(product: Product, context: Context): Promise<boolean> {
  // Redeemed or cancelled tickets never become redeemable again; skip their adapter round trips.
  const tokens = await context.modules.warehousing.findTokens({
    productId: product._id,
    invalidatedDate: null,
    'meta.cancelled': null,
  });
  for (let offset = 0; offset < tokens.length; offset += REDEEMABLE_CHECK_BATCH) {
    const redeemable = await Promise.all(
      tokens
        .slice(offset, offset + REDEEMABLE_CHECK_BATCH)
        .map((token) => context.services.warehousing.isTokenInvalidateable({ token, product })),
    );
    if (redeemable.some(Boolean)) return true;
  }
  return false;
}

export async function filterInvalidateableEvents(products: Product[], context: Context) {
  const matches = await Promise.all(products.map((product) => hasRedeemableTicket(product, context)));
  return products.filter((_, index) => matches[index]);
}

export default async function ticketEvents(
  root: never,
  {
    limit = 50,
    offset = 0,
    sort,
    onlyInvalidateable = false,
    ...params
  }: TicketEventQuery & {
    limit?: number;
    offset?: number;
    sort?: SortOption[];
  },
  context: Context,
) {
  log('query ticketEvents', { userId: context.userId });
  const query = await buildTicketEventQuery(params, context);
  const products = await context.modules.products.findProducts({
    ...query,
    sort,
    ...(onlyInvalidateable ? {} : { limit, offset }),
  });
  if (!onlyInvalidateable) return products;
  const filtered = await filterInvalidateableEvents(products, context);
  return filtered.slice(offset, limit ? offset + limit : undefined);
}
