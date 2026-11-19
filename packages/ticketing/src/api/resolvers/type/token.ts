import type { TokenSurrogate } from '@unchainedshop/core-warehousing';
import { TicketStatus, getTicketStatus, isTicketCancelled } from '../../../event-details.ts';

export { TicketStatus, getTicketStatus };

const toDate = (value: unknown) => {
  if (!(value instanceof Date) && typeof value !== 'string') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const Token = {
  isCanceled(token: TokenSurrogate): boolean {
    return isTicketCancelled(token);
  },

  ticketStatus(token: TokenSurrogate): TicketStatus {
    return getTicketStatus(token);
  },

  /** Set for tickets cancelled since the cancellation date is recorded. */
  cancelledDate(token: TokenSurrogate): Date | null {
    return isTicketCancelled(token) ? toDate(token.meta?.cancelledDate) : null;
  },

  /**
   * The name the project stored for the attendee when the ticket was issued (ticketMeta hook of
   * the ticket issuer). Never derived from the buyer's user data.
   */
  attendeeName(token: TokenSurrogate): string | null {
    const name = token.meta?.attendeeName;
    return typeof name === 'string' && name.trim() ? name.trim() : null;
  },
};
