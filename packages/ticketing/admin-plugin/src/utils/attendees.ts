// Attendee list helpers shared by the event detail and the gate. Pure, so they run in node --test.
import { csvCell, toCsv } from '../../../src/csv.ts';

interface TicketUser {
  _id: string;
  name?: string | null;
  // Only loaded for viewers with viewUserContactInfos (@include(if: $withContacts))
  primaryEmail?: { address?: string | null } | null;
  lastContact?: { emailAddress?: string | null; telNumber?: string | null } | null;
}

export interface AttendeeTicket {
  _id: string;
  tokenSerialNumber?: string | null;
  attendeeName?: string | null;
  ticketStatus?: string | null;
  invalidatedDate?: string | null;
  cancelledDate?: string | null;
  user?: TicketUser | null;
}

/**
 * The buyer as gate staff may see them: User.name falls back to the user id when the buyer has no
 * display name (guest checkout), which says nothing to a human, so that shows as guestLabel.
 */
export const buyerLabel = (user: TicketUser | null | undefined, guestLabel: string) => {
  if (!user) return '';
  return user.name && user.name !== user._id ? user.name : guestLabel;
};

/**
 * The buyer contact: e-mail and phone of the last checkout, else the primary e-mail (a guest's
 * primary e-mail is a generated placeholder, the checkout contact is the one they gave).
 */
export const buyerContact = (user: TicketUser | null | undefined) => ({
  email: user?.lastContact?.emailAddress || user?.primaryEmail?.address || null,
  phone: user?.lastContact?.telNumber || null,
});

/** Case-insensitive search over serial (with or without #), ticket id, attendee and buyer name. */
export const matchesTicketFilter = (ticket: AttendeeTicket, text: string) => {
  const needle = text.trim().replace(/^#/, '').toLowerCase();
  if (!needle) return true;
  return [
    ticket.tokenSerialNumber,
    ticket._id,
    ticket.attendeeName,
    ticket.user?.name !== ticket.user?._id ? ticket.user?.name : null,
  ].some((value) => value?.toLowerCase().includes(needle));
};

export { csvCell };

export interface AttendeeCsvLabels {
  ticketId: string;
  serial: string;
  attendee: string;
  buyer: string;
  status: string;
  redeemedAt: string;
  cancelledAt: string;
  guest: string;
  /** With these two, the buyer e-mail and phone follow the buyer (viewers with viewUserContactInfos) */
  email?: string;
  phone?: string;
}

/**
 * RFC 4180 CSV of the tickets as listed: ids, attendee and buyer names, status and dates
 * (ISO 8601), with the buyer e-mail and phone when their labels are given. A cancelled ticket
 * also carries an invalidatedDate, so "redeemed at" is only filled for redeemed tickets.
 */
export const buildAttendeeCsv = (tickets: AttendeeTicket[], labels: AttendeeCsvLabels) => {
  const withContacts = Boolean(labels.email && labels.phone);
  const contactOf = (ticket: AttendeeTicket) => {
    if (!withContacts) return [];
    const { email, phone } = buyerContact(ticket.user);
    return [email, phone];
  };
  const rows = [
    [
      labels.ticketId,
      labels.serial,
      labels.attendee,
      labels.buyer,
      ...(withContacts ? [labels.email, labels.phone] : []),
      labels.status,
      labels.redeemedAt,
      labels.cancelledAt,
    ],
    ...tickets.map((ticket) => [
      ticket._id,
      ticket.tokenSerialNumber,
      ticket.attendeeName,
      buyerLabel(ticket.user, labels.guest),
      ...contactOf(ticket),
      ticket.ticketStatus,
      ticket.ticketStatus === 'REDEEMED' ? ticket.invalidatedDate : null,
      ticket.ticketStatus === 'CANCELLED' ? ticket.cancelledDate : null,
    ]),
  ];
  return toCsv(rows);
};
