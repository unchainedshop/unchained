import type { Context } from '@unchainedshop/api';
import { log } from '@unchainedshop/logger';
import { withTicketProductionErrors } from '../../errors.ts';
import { findTicketProductionInScope, getProductionServices } from '../../production-access.ts';

export default async function removeTicketProduction(
  _root: never,
  { productionId }: { productionId: string },
  context: Context,
) {
  log(`mutation removeTicketProduction ${productionId}`, { userId: context.userId });
  const services = getProductionServices(context);
  await findTicketProductionInScope(productionId, context);
  const productIds = await withTicketProductionErrors(
    () => services.removeTicketProduction(productionId),
    { productionId },
  );
  // Performances first, so none stays on sale as a standalone event
  for (const productId of productIds) {
    await context.services.products.removeProduct({ productId });
  }
  return context.modules.products.findProduct({ productId: productionId });
}
