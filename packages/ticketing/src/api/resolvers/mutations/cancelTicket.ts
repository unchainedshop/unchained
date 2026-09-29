import type { Context } from '@unchainedshop/api';
import { log } from '@unchainedshop/logger';
import { InvalidIdError, TokenNotFoundError } from '@unchainedshop/api';
import { TicketingModuleNotFoundError, TokenAlreadyRedeemedError } from '../../errors.ts';
import { assertTicketEventInScope, hasTicketEventScope } from '../../roles.ts';

export default async function cancelTicket(
  root: never,
  { tokenId, generateDiscount }: { tokenId: string; generateDiscount?: boolean },
  context: Context,
) {
  const { modules, services, userId, countryCode, currencyCode } = context;
  log(`mutation cancelTicket ${tokenId}`, { userId, generateDiscount });

  if (!tokenId) throw new InvalidIdError({ tokenId });

  const token = await modules.warehousing.findToken({ tokenId });
  if (!token) throw new TokenNotFoundError({ tokenId });

  // A role granted cancelTicket stays within its organizer scope.
  if (hasTicketEventScope(context)) {
    const product = await modules.products.findProduct({ productId: token.productId });
    await assertTicketEventInScope(product, context, 'cancelTicket');
  }

  if (token.meta?.cancelled) {
    return token;
  }

  if (token.invalidatedDate) {
    throw new TokenAlreadyRedeemedError({ tokenId });
  }

  const passes = (modules as unknown as Record<string, unknown>).passes as any;
  if (!passes?.cancelTicket) {
    throw new TicketingModuleNotFoundError({});
  }

  const ticketingServices = (services as unknown as any).ticketing;
  if (!ticketingServices?.cancelTicketWithDiscount) {
    throw new TicketingModuleNotFoundError({});
  }

  // The check above read the ticket earlier; the service refuses a ticket that a scan redeems in
  // the meantime, so it is never both admitted and reimbursed.
  try {
    const result = await ticketingServices.cancelTicketWithDiscount(tokenId, {
      generateDiscount,
      countryCode,
      currencyCode,
      refuseRedeemed: true,
    });
    return result.token;
  } catch (error) {
    if ((error as Error)?.cause === 'TICKET_ALREADY_REDEEMED') {
      throw new TokenAlreadyRedeemedError({ tokenId });
    }
    throw error;
  }
}
