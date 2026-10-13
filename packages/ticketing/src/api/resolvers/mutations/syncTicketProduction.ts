import type { Context, GraphQLResolveInfo } from '@unchainedshop/api';
import { log } from '@unchainedshop/logger';
import { withTicketProductionErrors } from '../../errors.ts';
import { findTicketProductionInScope, getProductionServices } from '../../production-access.ts';

export default async function syncTicketProduction(
  _root: never,
  { productionId }: { productionId: string },
  context: Context,
  info: GraphQLResolveInfo,
) {
  log(`mutation syncTicketProduction ${productionId}`, { userId: context.userId });
  const services = getProductionServices(context);
  await findTicketProductionInScope(productionId, context, info);
  return withTicketProductionErrors(() => services.syncTicketProduction(productionId), {
    productionId,
  });
}
