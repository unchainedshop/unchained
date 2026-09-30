import { log } from '@unchainedshop/logger';
import type { Context } from '@unchainedshop/api';
import { hasTicketEventScope } from '../../roles.ts';
import {
  buildTicketProductionQuery,
  findCheckedTicketProductions,
  type TicketProductionQuery,
} from './ticketProductions.ts';

export default async function ticketProductionsCount(
  root: never,
  params: TicketProductionQuery,
  context: Context,
) {
  log('query ticketProductionsCount', { userId: context.userId });
  if (hasTicketEventScope(context)) {
    return (await findCheckedTicketProductions(params, {}, context)).length;
  }
  return context.modules.products.count(await buildTicketProductionQuery(params, context));
}
