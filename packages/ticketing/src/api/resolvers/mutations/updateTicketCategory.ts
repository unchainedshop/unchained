import type { Context, GraphQLResolveInfo } from '@unchainedshop/api';
import { log } from '@unchainedshop/logger';
import type { TicketCategoryInput } from '../../../production-services.ts';
import { withTicketProductionErrors } from '../../errors.ts';
import { findTicketProductionInScope, getProductionServices } from '../../production-access.ts';

export default async function updateTicketCategory(
  _root: never,
  {
    productionId,
    code,
    category,
    applyToPerformances,
  }: {
    productionId: string;
    code: string;
    category: Omit<TicketCategoryInput, 'code'>;
    applyToPerformances?: boolean;
  },
  context: Context,
  info: GraphQLResolveInfo,
) {
  log(`mutation updateTicketCategory ${productionId}`, { userId: context.userId });
  const services = getProductionServices(context);
  await findTicketProductionInScope(productionId, context, info);
  return withTicketProductionErrors(
    () => services.updateTicketCategory(productionId, code, category, { applyToPerformances }),
    { productionId, code },
  );
}
