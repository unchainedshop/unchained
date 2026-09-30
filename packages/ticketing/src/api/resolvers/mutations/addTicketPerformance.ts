import type { Context } from '@unchainedshop/api';
import { log } from '@unchainedshop/logger';
import type { TicketPerformanceInput } from '../../../production-services.ts';
import { withTicketProductionErrors } from '../../errors.ts';
import { findTicketProductionInScope, getProductionServices } from '../../production-access.ts';

export default async function addTicketPerformance(
  _root: never,
  { productionId, performance }: { productionId: string; performance: TicketPerformanceInput },
  context: Context,
) {
  log(`mutation addTicketPerformance ${productionId}`, { userId: context.userId });
  const services = getProductionServices(context);
  await findTicketProductionInScope(productionId, context);
  return withTicketProductionErrors(() => services.addTicketPerformance(productionId, performance), {
    productionId,
  });
}
