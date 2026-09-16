import { log } from '@unchainedshop/logger';
import type { SortOption } from '@unchainedshop/utils';
import type { Context } from '@unchainedshop/api';
import type { Product } from '@unchainedshop/core-products';
import { TicketingModuleNotFoundError } from '../../errors.ts';
import { GATE_COOKIE_NAME } from '../../gate-cookie.ts';

export interface TicketEventQuery {
  queryString?: string;
  includeDrafts?: boolean;
  onlyInvalidateable?: boolean;
}

export async function buildTicketEventQuery(
  { queryString, includeDrafts = true }: TicketEventQuery,
  context: Context,
) {
  const canManage = await context.roles?.userHasPermission(context, 'manageProducts', [undefined, {}]);
  const query = { type: 'TOKENIZED_PRODUCT', queryString, includeDrafts: canManage && includeDrafts };
  if (canManage) return query;
  const passCode = context.getCookie?.(GATE_COOKIE_NAME);
  if (!passCode) return { ...query, productIds: [] };
  const ticketing = (context.services as any).ticketing;
  if (!ticketing?.productIdsForPassCode) throw new TicketingModuleNotFoundError({});
  return { ...query, productIds: (await ticketing.productIdsForPassCode(passCode)) as string[] };
}

export async function filterInvalidateableEvents(products: Product[], context: Context) {
  const matches = await Promise.all(
    products.map(async (product) => {
      const tokens = await context.modules.warehousing.findTokens({ productId: product._id });
      const valid = await Promise.all(
        tokens.map((token) => context.services.warehousing.isTokenInvalidateable({ token, product })),
      );
      return valid.some(Boolean);
    }),
  );
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
