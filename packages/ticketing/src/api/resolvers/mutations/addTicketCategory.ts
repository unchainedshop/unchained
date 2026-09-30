import type { Context } from '@unchainedshop/api';
import { log } from '@unchainedshop/logger';
import type { TicketCategoryInput } from '../../../production-services.ts';
import { withTicketProductionErrors } from '../../errors.ts';
import { findTicketProductionInScope, getProductionServices } from '../../production-access.ts';

export default async function addTicketCategory(
  _root: never,
  { productionId, category }: { productionId: string; category: TicketCategoryInput },
  context: Context,
) {
  log(`mutation addTicketCategory ${productionId}`, { userId: context.userId });
  const services = getProductionServices(context);
  await findTicketProductionInScope(productionId, context);
  return withTicketProductionErrors(() => services.addTicketCategory(productionId, category), {
    productionId,
  });
}
