import { log } from '@unchainedshop/logger';
import type { Context } from '@unchainedshop/api';
import {
  buildTicketEventQuery,
  findCheckedTicketEvents,
  needsEventChecks,
  type TicketEventQuery,
} from './ticketEvents.ts';

export default async function ticketEventsCount(
  root: never,
  { onlyInvalidateable = false, ...params }: TicketEventQuery,
  context: Context,
) {
  log('query ticketEventsCount', { userId: context.userId });
  if (needsEventChecks(onlyInvalidateable, context)) {
    const events = await findCheckedTicketEvents({ ...params, onlyInvalidateable }, {}, context);
    return events.length;
  }
  return context.modules.products.count(await buildTicketEventQuery(params, context));
}
