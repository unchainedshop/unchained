import type { Context } from '../../../context.ts';
import { log } from '@unchainedshop/logger';
import {
  InvalidIdError,
  TokenNotFoundError,
  TokenAlreadyRedeemedError,
  TicketingModuleNotFoundError,
} from '../../../errors.ts';

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

  const result = await ticketingServices.cancelTicketWithDiscount(tokenId, {
    generateDiscount,
    countryCode,
    currencyCode,
  });

  return result.token;
}
