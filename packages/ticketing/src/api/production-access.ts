import type { Context } from '@unchainedshop/api';
import { InvalidIdError } from '@unchainedshop/api';
import { isTicketProduction } from '../production.ts';
import type { TicketingServices } from '../services.ts';
import { TicketProductionNotFoundError, TicketingModuleNotFoundError } from './errors.ts';
import { assertTicketEventInScope } from './roles.ts';

/** The production a mutation changes, within the organizer scope of the user. */
export async function findTicketProductionInScope(productionId: string, context: Context) {
  if (!productionId) throw new InvalidIdError({ productionId });
  const production = await context.modules.products.findProduct({ productId: productionId });
  if (!isTicketProduction(production)) throw new TicketProductionNotFoundError({ productionId });
  await assertTicketEventInScope(production, context, 'manageProducts');
  return production!;
}

export function getProductionServices(context: Context): TicketingServices['ticketing'] {
  const ticketing = (context.services as unknown as Partial<TicketingServices>).ticketing;
  if (!ticketing?.createTicketProduction) throw new TicketingModuleNotFoundError({});
  return ticketing;
}
