import { log } from '@unchainedshop/logger';
import type { Context } from '@unchainedshop/api';
import {
  buildTicketEventQuery,
  filterInvalidateableEvents,
  type TicketEventQuery,
} from './ticketEvents.ts';

export default async function ticketEventsCount(
  root: never,
  { onlyInvalidateable = false, ...params }: TicketEventQuery,
  context: Context,
) {
  log('query ticketEventsCount', { userId: context.userId });
  const query = await buildTicketEventQuery(params, context);
  if (!onlyInvalidateable) return context.modules.products.count(query);
  const products = await context.modules.products.findProducts(query);
  return (await filterInvalidateableEvents(products, context)).length;
}
