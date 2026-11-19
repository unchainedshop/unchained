import type { Context, GraphQLResolveInfo } from '@unchainedshop/api';
import { log } from '@unchainedshop/logger';
import { withTicketProductionErrors } from '../../errors.ts';
import { findTicketProductionInScope, getProductionServices } from '../../production-access.ts';

export default async function removeTicketPerformance(
  _root: never,
  { productionId, startsAt }: { productionId: string; startsAt: Date },
  context: Context,
  info: GraphQLResolveInfo,
) {
  log(`mutation removeTicketPerformance ${productionId}`, { userId: context.userId });
  const services = getProductionServices(context);
  await findTicketProductionInScope(productionId, context, info);
  const slot = new Date(startsAt).toISOString();
  await withTicketProductionErrors(() => services.removeTicketPerformance(productionId, slot, context), {
    productionId,
    startsAt,
  });
  return context.modules.products.findProduct({ productId: productionId });
}
