import type { Context, GraphQLResolveInfo } from '@unchainedshop/api';
import { log } from '@unchainedshop/logger';
import { withTicketProductionErrors } from '../../errors.ts';
import { findTicketProductionInScope, getProductionServices } from '../../production-access.ts';

export default async function removeTicketCategory(
  _root: never,
  { productionId, code }: { productionId: string; code: string },
  context: Context,
  info: GraphQLResolveInfo,
) {
  log(`mutation removeTicketCategory ${productionId}`, { userId: context.userId });
  const services = getProductionServices(context);
  await findTicketProductionInScope(productionId, context, info);
  await withTicketProductionErrors(() => services.removeTicketCategory(productionId, code, context), {
    productionId,
    code,
  });
  return context.modules.products.findProduct({ productId: productionId });
}
