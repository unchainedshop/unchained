import { randomUUID } from 'node:crypto';
import type { Context } from '@unchainedshop/api';
import { ProductType, type Product } from '@unchainedshop/core-products';
import { log } from '@unchainedshop/logger';
import type { CreateTicketProductionInput } from '../../../production-services.ts';
import { TICKET_PRODUCTION_TAG } from '../../../production.ts';
import { withTicketProductionErrors } from '../../errors.ts';
import { getProductionServices } from '../../production-access.ts';
import { assertTicketEventInScope } from '../../roles.ts';

export default async function createTicketProduction(
  _root: never,
  { production }: { production: CreateTicketProductionInput },
  context: Context,
) {
  log('mutation createTicketProduction', { userId: context.userId });
  const services = getProductionServices(context);
  // The organizer scope decides on the production as it will be stored
  const candidate = {
    _id: `new-ticket-production-${randomUUID()}`,
    type: ProductType.CONFIGURABLE_PRODUCT,
    tags: [TICKET_PRODUCTION_TAG, ...(production.tags ?? [])],
  } as Product;
  await assertTicketEventInScope(candidate, context, 'manageProducts');
  return withTicketProductionErrors(() => services.createTicketProduction(production));
}
