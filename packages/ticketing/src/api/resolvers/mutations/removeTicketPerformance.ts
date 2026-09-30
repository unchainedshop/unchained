import type { Context } from '@unchainedshop/api';
import { log } from '@unchainedshop/logger';
import { withTicketProductionErrors } from '../../errors.ts';
import { findTicketProductionInScope, getProductionServices } from '../../production-access.ts';

export default async function removeTicketPerformance(
  _root: never,
  { productionId, startsAt }: { productionId: string; startsAt: Date },
  context: Context,
) {
  log(`mutation removeTicketPerformance ${productionId}`, { userId: context.userId });
  const services = getProductionServices(context);
  await findTicketProductionInScope(productionId, context);
  const slot = new Date(startsAt).toISOString();
  const productIds = await withTicketProductionErrors(
    () => services.removeTicketPerformance(productionId, slot),
    { productionId, startsAt },
  );
  // Removes the performance products from carts and assortments as well
  for (const productId of productIds) {
    await context.services.products.removeProduct({ productId });
  }
  return context.modules.products.findProduct({ productId: productionId });
}
