// Attendee list helpers shared by the event detail and the gate. Pure, so they run in node --test.

interface TicketUser {
  _id: string;
  name?: string | null;
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

// Spreadsheets run cells starting with these as formulas; attendee names are customer input.
const FORMULA_START = /^[=+\-@\t\r]/;
const NEEDS_QUOTES = /[",;\r\n]/;

export const csvCell = (value: unknown) => {
  if (value === null || value === undefined) return '';
  let text = String(value);
  if (FORMULA_START.test(text)) text = `'${text}`;
  return NEEDS_QUOTES.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export interface AttendeeCsvLabels {
  ticketId: string;
  serial: string;
  attendee: string;
  buyer: string;
  status: string;
  redeemedAt: string;
  cancelledAt: string;
  guest: string;
}

/**
 * RFC 4180 CSV of the tickets as listed: ids, attendee and buyer names, status and dates
 * (ISO 8601). A cancelled ticket also carries an invalidatedDate, so "redeemed at" is only
 * filled for redeemed tickets.
 */
export const buildAttendeeCsv = (tickets: AttendeeTicket[], labels: AttendeeCsvLabels) => {
  const rows = [
    [
      labels.ticketId,
      labels.serial,
      labels.attendee,
      labels.buyer,
      labels.status,
      labels.redeemedAt,
      labels.cancelledAt,
    ],
    ...tickets.map((ticket) => [
      ticket._id,
      ticket.tokenSerialNumber,
      ticket.attendeeName,
      buyerLabel(ticket.user, labels.guest),
      ticket.ticketStatus,
      ticket.ticketStatus === 'REDEEMED' ? ticket.invalidatedDate : null,
      ticket.ticketStatus === 'CANCELLED' ? ticket.cancelledDate : null,
    ]),
  ];
  return rows.map((row) => `${row.map(csvCell).join(',')}\r\n`).join('');
};
