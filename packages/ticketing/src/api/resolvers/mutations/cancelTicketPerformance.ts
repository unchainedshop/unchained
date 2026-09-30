import type { Context } from '@unchainedshop/api';
import { InvalidIdError } from '@unchainedshop/api';
import { log } from '@unchainedshop/logger';
import { isTicketProduction } from '../../../production.ts';
import { findTicketPerformance } from '../../../production-services.ts';
import { TicketProductionNotFoundError, withTicketProductionErrors } from '../../errors.ts';
import { getProductionServices } from '../../production-access.ts';
import { assertTicketEventInScope } from '../../roles.ts';

/** Cancels the tickets of one performance in all categories, like cancelEvent per product. */
export default async function cancelTicketPerformance(
  _root: never,
  {
    productionId,
    startsAt,
    generateDiscount,
  }: { productionId: string; startsAt: Date; generateDiscount?: boolean },
  context: Context,
) {
  const { modules, userId, countryCode, currencyCode } = context;
  log(`mutation cancelTicketPerformance ${productionId}`, { userId });
  if (!productionId) throw new InvalidIdError({ productionId });
  const services = getProductionServices(context);
  const production = await modules.products.findProduct({ productId: productionId });
  if (!isTicketProduction(production)) throw new TicketProductionNotFoundError({ productionId });
  // A role granted cancelTicket stays within its organizer scope.
  await assertTicketEventInScope(production, context, 'cancelTicket');

  const slot = new Date(startsAt).toISOString();
  const performance = await withTicketProductionErrors(
    () => findTicketPerformance(modules, production!, slot),
    { productionId, startsAt },
  );
  let cancelled = 0;
  for (const { product } of performance) {
    const { cancelledCount } = await services.cancelTicketsForProduct(product._id, {
      generateDiscount,
      countryCode,
      currencyCode,
    });
    cancelled += cancelledCount;
  }
  return cancelled;
}
