import { log } from '@unchainedshop/logger';
import type { SortOption } from '@unchainedshop/utils';
import type { Context } from '@unchainedshop/api';
import { ProductType } from '@unchainedshop/core-products';
import { TICKET_PRODUCTION_TAG } from '../../../production.ts';
import { hasTicketEventScope, resolveTicketingAccess } from '../../roles.ts';
import { findCheckedTicketEvents, type TicketEventQuery } from './ticketEvents.ts';

export interface TicketProductionQuery {
  queryString?: string;
  includeDrafts?: boolean;
  /** Only productions carrying all of these tags. */
  tags?: string[] | null;
}

export async function buildTicketProductionQuery(
  { queryString, includeDrafts = true, tags }: TicketProductionQuery,
  context: Context,
) {
  const access = await resolveTicketingAccess(context);
  return {
    type: ProductType.CONFIGURABLE_PRODUCT,
    queryString,
    includeDrafts: Boolean(access?.includeDrafts && includeDrafts),
    tags: [TICKET_PRODUCTION_TAG, ...(tags ?? [])],
  };
}

/** Productions in the organizer scope, checked production by production like ticket events. */
export const findCheckedTicketProductions = (
  params: TicketProductionQuery,
  paging: { limit?: number; offset?: number; sort?: SortOption[] },
  context: Context,
) =>
  findCheckedTicketEvents(
    params as TicketEventQuery,
    paging,
    context,
    buildTicketProductionQuery as any,
  );

export default async function ticketProductions(
  root: never,
  {
    limit = 50,
    offset = 0,
    sort,
    ...params
  }: TicketProductionQuery & { limit?: number; offset?: number; sort?: SortOption[] },
  context: Context,
) {
  log('query ticketProductions', { userId: context.userId });
  if (hasTicketEventScope(context)) {
    return findCheckedTicketProductions(params, { limit, offset, sort }, context);
  }
  const query = await buildTicketProductionQuery(params, context);
  return context.modules.products.findProducts({ ...query, sort, limit, offset });
}
