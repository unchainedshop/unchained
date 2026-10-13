import type { Context, GraphQLResolveInfo } from '@unchainedshop/api';
import { log } from '@unchainedshop/logger';
import type { TicketPerformanceInput } from '../../../production-services.ts';
import { withTicketProductionErrors } from '../../errors.ts';
import { findTicketProductionInScope, getProductionServices } from '../../production-access.ts';

export default async function updateTicketPerformance(
  _root: never,
  {
    productionId,
    startsAt,
    performance,
  }: { productionId: string; startsAt: Date; performance: TicketPerformanceInput },
  context: Context,
  info: GraphQLResolveInfo,
) {
  log(`mutation updateTicketPerformance ${productionId}`, { userId: context.userId });
  const services = getProductionServices(context);
  await findTicketProductionInScope(productionId, context, info);
  const slot = new Date(startsAt).toISOString();
  return withTicketProductionErrors(
    () => services.updateTicketPerformance(productionId, slot, performance),
    { productionId, startsAt },
  );
}
