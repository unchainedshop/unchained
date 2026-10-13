import type { Context, GraphQLResolveInfo } from '@unchainedshop/api';
import { log } from '@unchainedshop/logger';
import type { UpdateTicketProductionInput } from '../../../production-services.ts';
import { withTicketProductionErrors } from '../../errors.ts';
import { findTicketProductionInScope, getProductionServices } from '../../production-access.ts';

export default async function updateTicketProduction(
  _root: never,
  { productionId, production }: { productionId: string; production: UpdateTicketProductionInput },
  context: Context,
  info: GraphQLResolveInfo,
) {
  log(`mutation updateTicketProduction ${productionId}`, { userId: context.userId });
  const services = getProductionServices(context);
  await findTicketProductionInScope(productionId, context, info);
  return withTicketProductionErrors(() => services.updateTicketProduction(productionId, production), {
    productionId,
  });
}
