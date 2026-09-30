import type { Context } from '@unchainedshop/api';
import { log } from '@unchainedshop/logger';
import { withTicketProductionErrors } from '../../errors.ts';
import { findTicketProductionInScope, getProductionServices } from '../../production-access.ts';

export default async function removeTicketCategory(
  _root: never,
  { productionId, code }: { productionId: string; code: string },
  context: Context,
) {
  log(`mutation removeTicketCategory ${productionId}`, { userId: context.userId });
  const services = getProductionServices(context);
  await findTicketProductionInScope(productionId, context);
  const productIds = await withTicketProductionErrors(
    () => services.removeTicketCategory(productionId, code),
    { productionId, code },
  );
  // Removes the products of the category from carts and assortments as well
  for (const productId of productIds) {
    await context.services.products.removeProduct({ productId });
  }
  return context.modules.products.findProduct({ productId: productionId });
}
