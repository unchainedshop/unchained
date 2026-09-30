import { log } from '@unchainedshop/logger';
import { SortDirection, type SortOption } from '@unchainedshop/utils';
import type { Context } from '@unchainedshop/api';
import { ProductType, type Product } from '@unchainedshop/core-products';
import { hasTicketEventScope, isTicketEventInScope, resolveTicketingAccess } from '../../roles.ts';
import { TicketEventProperty } from '../../../event-details.ts';
import { TICKET_PRODUCTION_TAG, isTicketProduction } from '../../../production.ts';

export interface TicketEventQuery {
  queryString?: string;
  includeDrafts?: boolean;
  onlyInvalidateable?: boolean;
  /** Only events starting at or after this date. */
  slotFrom?: Date | string | null;
  /** Only events starting at or before this date. */
  slotTo?: Date | string | null;
  /** Only events carrying all of these tags. */
  tags?: string[] | null;
  /** Only the performances of this production. */
  productionId?: string | null;
  /** true: only events that are not a performance of a production. */
  standalone?: boolean | null;
}

const SLOT_PATH = `meta.${TicketEventProperty.START}`;

const toDate = (value?: Date | string | null) => {
  if (value === undefined || value === null || value === '') return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

// Starts are stored as BSON dates (bulk import) or ISO strings (JSON input), and range operators
// only compare values of the same type, so both are matched.
function buildSlotRangeSelector(slotFrom?: Date | string | null, slotTo?: Date | string | null) {
  const from = toDate(slotFrom);
  const to = toDate(slotTo);
  if (!from && !to) return null;
  const range = (convert: (date: Date) => Date | string) => ({
    ...(from && { $gte: convert(from) }),
    ...(to && { $lte: convert(to) }),
  });
  return {
    $or: [{ [SLOT_PATH]: range((date) => date) }, { [SLOT_PATH]: range((date) => date.toISOString()) }],
  };
}

// The performances of all productions, drafts included.
async function findPerformanceIds(context: Context, productionId?: string | null) {
  const productions = productionId
    ? [await context.modules.products.findProduct({ productId: productionId })]
    : await context.modules.products.findProducts({
        type: ProductType.CONFIGURABLE_PRODUCT,
        tags: [TICKET_PRODUCTION_TAG],
        includeDrafts: true,
      });
  return productions
    .filter(isTicketProduction)
    .flatMap((production) => (production!.proxy?.assignments ?? []).map(({ productId }) => productId));
}

export async function buildTicketEventQuery(
  {
    queryString,
    includeDrafts = true,
    onlyInvalidateable,
    slotFrom,
    slotTo,
    tags,
    productionId,
    standalone,
  }: TicketEventQuery,
  context: Context,
) {
  const access = await resolveTicketingAccess(context);
  const selectors: Record<string, unknown>[] = [];
  if (productionId) selectors.push({ _id: { $in: await findPerformanceIds(context, productionId) } });
  if (standalone) selectors.push({ _id: { $nin: await findPerformanceIds(context) } });
  const slotRange = buildSlotRangeSelector(slotFrom, slotTo);
  if (slotRange) selectors.push(slotRange);
  // Tickets of a cancelled event are cancelled as well, so these events are never redeemable.
  if (onlyInvalidateable) selectors.push({ 'meta.cancelled': { $ne: true } });
  return {
    type: ProductType.TOKENIZED_PRODUCT,
    queryString,
    includeDrafts: Boolean(access?.includeDrafts && includeDrafts),
    ...(tags?.length ? { tags } : {}),
    ...(selectors.length
      ? { productSelector: selectors.length === 1 ? selectors[0] : { $and: selectors } }
      : {}),
  };
}

// Tickets are checked page by page and the scan stops at the first redeemable one, so events
// whose tickets are mostly redeemed stay cheap to list and no event loads all its tickets at once.
const REDEEMABLE_CHECK_BATCH = 20;

async function hasRedeemableTicket(product: Product, context: Context): Promise<boolean> {
  for (let skip = 0; ; skip += REDEEMABLE_CHECK_BATCH) {
    // Redeemed or cancelled tickets never become redeemable again; skip their adapter round trips.
    const tokens = await context.modules.warehousing.findTokens(
      { productId: product._id, invalidatedDate: null, 'meta.cancelled': null },
      { limit: REDEEMABLE_CHECK_BATCH, skip, sort: { _id: 1 } },
    );
    const redeemable = await Promise.all(
      tokens.map((token) => context.services.warehousing.isTokenInvalidateable({ token, product })),
    );
    if (redeemable.some(Boolean)) return true;
    if (tokens.length < REDEEMABLE_CHECK_BATCH) return false;
  }
}

// Mirrors the default order of findProducts; _id makes it total so batches never overlap.
const DEFAULT_SORT: SortOption[] = [
  { key: 'sequence', value: SortDirection.ASC },
  { key: 'published', value: SortDirection.DESC },
];
const EVENT_BATCH = 50;
const EVENT_CHECK_CHUNK = 10;

/**
 * Events that need a check per event (redeemable tickets, organizer scope) are loaded batch by
 * batch in the requested order and checked in small chunks until the requested page is filled.
 * A limit of 0 (and counting) walks all matching events; narrow them with slotFrom/slotTo.
 */
export async function findCheckedTicketEvents(
  { onlyInvalidateable = false, ...params }: TicketEventQuery,
  { limit = 0, offset = 0, sort }: { limit?: number; offset?: number; sort?: SortOption[] },
  context: Context,
  buildQuery: typeof buildTicketEventQuery = buildTicketEventQuery,
): Promise<Product[]> {
  const query = await buildQuery({ ...params, onlyInvalidateable }, context);
  const scoped = hasTicketEventScope(context);
  const isWanted = async (product: Product) =>
    (!scoped || (await isTicketEventInScope(product, context))) &&
    (!onlyInvalidateable || (await hasRedeemableTicket(product, context)));

  const wanted = limit > 0 ? offset + limit : Infinity;
  const stableSort = [...(sort?.length ? sort : DEFAULT_SORT), { key: '_id', value: SortDirection.ASC }];
  const matches: Product[] = [];
  for (let skip = 0; matches.length < wanted; skip += EVENT_BATCH) {
    const batch = await context.modules.products.findProducts({
      ...query,
      sort: stableSort,
      limit: EVENT_BATCH,
      offset: skip,
    });
    for (let index = 0; index < batch.length && matches.length < wanted; index += EVENT_CHECK_CHUNK) {
      const chunk = batch.slice(index, index + EVENT_CHECK_CHUNK);
      const accepted = await Promise.all(chunk.map(isWanted));
      matches.push(...chunk.filter((_, position) => accepted[position]));
    }
    if (batch.length < EVENT_BATCH) break;
  }
  return matches.slice(offset, limit > 0 ? offset + limit : undefined);
}

/** Whether the list must be checked event by event instead of paginated by the database. */
export const needsEventChecks = (onlyInvalidateable: boolean, context: Context) =>
  onlyInvalidateable || hasTicketEventScope(context);

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
  if (needsEventChecks(onlyInvalidateable, context)) {
    return findCheckedTicketEvents({ ...params, onlyInvalidateable }, { limit, offset, sort }, context);
  }
  const query = await buildTicketEventQuery(params, context);
  return context.modules.products.findProducts({ ...query, sort, limit, offset });
}
