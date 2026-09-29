import { useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { Table } from '@unchainedshop/admin-ui/ui';
import { buyerLabel, matchesTicketFilter } from '../utils/attendees.ts';
import TicketStatusBadge from './TicketStatusBadge.tsx';

// Rendering thousands of rows makes a phone at the gate sluggish; the filter narrows them down.
const MAX_ROWS = 100;

const units = (tokens) => tokens.reduce((sum, token) => sum + (token.quantity || 1), 0);

const countAdmissions = (tokens) => {
  const active = tokens.filter((token) => token.ticketStatus !== 'CANCELLED');
  return {
    redeemed: units(active.filter((token) => token.ticketStatus === 'REDEEMED')),
    active: units(active),
    cancelled: units(tokens) - units(active),
  };
};

// Tickets of the list carry no event; the result card shows the one they belong to.
const productOf = (event) => ({
  _id: event._id,
  status: event.status,
  isCanceled: event.isCanceled,
  eventStartsAt: event.eventStartsAt,
  eventCategory: event.eventCategory,
  texts: event.texts,
});

const eventLabel = (product) => product?.eventCategory || product?.texts?.title || '-';

/**
 * Tickets of the gate's events with a local filter (serial, attendee, buyer) and how many have
 * been admitted, per event when the gate admits several. Redeeming goes through the gate so the
 * verdict shows in the result card.
 */
const GateAttendeeList = ({
  events,
  busy = false,
  onRedeem,
}: {
  events: any[];
  busy?: boolean;
  onRedeem: (ticket: any) => void;
}) => {
  const { formatMessage } = useIntl();
  const [filter, setFilter] = useState('');
  const guest = formatMessage({ id: 'gate_guest', defaultMessage: 'Guest' });
  const severalEvents = events.length > 1;

  const tokens = useMemo(
    () =>
      events.flatMap((event) => {
        const product = productOf(event);
        return (event.tokens || []).map((token) => ({ ...token, product }));
      }),
    [events],
  );
  const total = countAdmissions(tokens);
  const matches = useMemo(
    () => tokens.filter((token) => matchesTicketFilter(token, filter)),
    [tokens, filter],
  );

  return (
    <div className="rounded-lg border border-border-subtle bg-surface shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle p-4">
        <div>
          <span className="text-2xl font-bold text-text-primary">{total.redeemed}</span>
          <span className="text-text-muted"> / {total.active} </span>
          <span className="text-sm text-text-muted">
            {formatMessage({ id: 'gate_redeemed', defaultMessage: 'redeemed' })}
          </span>
          {total.cancelled > 0 && (
            <span className="ml-3 text-sm text-text-muted">
              {formatMessage(
                { id: 'gate_cancelled_count', defaultMessage: '{count} cancelled' },
                { count: total.cancelled },
              )}
            </span>
          )}
          {severalEvents && (
            <p className="mt-1 text-sm text-text-muted">
              {events
                .map((event) => {
                  const { redeemed, active } = countAdmissions(event.tokens || []);
                  return `${eventLabel(event)} ${redeemed} / ${active}`;
                })
                .join(' · ')}
            </p>
          )}
        </div>
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder={formatMessage({
            id: 'gate_filter_placeholder',
            defaultMessage: 'Filter by #serial, attendee or buyer',
          })}
          aria-label={formatMessage({ id: 'gate_filter_label', defaultMessage: 'Filter tickets' })}
          className="block w-full max-w-xs rounded-md border border-border-default bg-surface-input px-3 py-2 text-sm text-text-primary placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-focus-ring"
        />
      </div>

      {!matches.length ? (
        <p className="p-4 text-sm text-text-muted">
          {tokens.length
            ? formatMessage({ id: 'gate_no_matches', defaultMessage: 'No ticket matches the filter.' })
            : formatMessage(
                {
                  id: 'gate_no_tickets',
                  defaultMessage:
                    '{count, plural, one {No tickets for this event.} other {No tickets for these events.}}',
                },
                { count: events.length },
              )}
        </p>
      ) : (
        <Table className="min-w-full">
          <Table.Row header>
            <Table.Cell>
              {formatMessage({ id: 'gate_ticket_number', defaultMessage: 'Ticket #' })}
            </Table.Cell>
            {severalEvents && (
              <Table.Cell>
                {formatMessage({ id: 'gate_ticket_event', defaultMessage: 'Event' })}
              </Table.Cell>
            )}
            <Table.Cell>
              {formatMessage({ id: 'gate_ticket_attendee', defaultMessage: 'Attendee' })}
            </Table.Cell>
            <Table.Cell>
              {formatMessage({ id: 'gate_ticket_buyer', defaultMessage: 'Buyer' })}
            </Table.Cell>
            <Table.Cell>
              {formatMessage({ id: 'gate_ticket_status', defaultMessage: 'Status' })}
            </Table.Cell>
            <Table.Cell> </Table.Cell>
          </Table.Row>
          {matches.slice(0, MAX_ROWS).map((token) => {
            const buyer = buyerLabel(token.user, guest);
            return (
              <Table.Row key={token._id}>
                <Table.Cell>
                  <span className="font-medium text-text-primary">
                    {token.tokenSerialNumber || token._id?.slice(-8)}
                  </span>
                  {token.quantity > 1 && (
                    <span className="ml-1 text-sm text-text-muted">×{token.quantity}</span>
                  )}
                </Table.Cell>
                {severalEvents && (
                  <Table.Cell>
                    <span className="text-sm text-text-secondary">{eventLabel(token.product)}</span>
                  </Table.Cell>
                )}
                <Table.Cell>
                  <span className="text-sm text-text-primary">{token.attendeeName || '-'}</span>
                </Table.Cell>
                <Table.Cell>
                  <span
                    className={buyer === guest ? 'text-sm text-text-muted' : 'text-sm text-text-primary'}
                  >
                    {buyer || '-'}
                  </span>
                </Table.Cell>
                <Table.Cell>
                  <TicketStatusBadge token={token} dateStyle="time" />
                </Table.Cell>
                <Table.Cell>
                  {token.ticketStatus === 'VALID' && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onRedeem(token)}
                      className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                      {formatMessage({ id: 'gate_redeem', defaultMessage: 'Redeem' })}
                    </button>
                  )}
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table>
      )}
      {matches.length > MAX_ROWS && (
        <p className="p-4 text-sm text-text-muted">
          {formatMessage(
            {
              id: 'gate_more_rows',
              defaultMessage: 'Showing {shown} of {count} tickets, filter to find the others.',
            },
            { shown: MAX_ROWS, count: matches.length },
          )}
        </p>
      )}
    </div>
  );
};

export default GateAttendeeList;
