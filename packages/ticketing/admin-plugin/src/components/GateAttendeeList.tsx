import { useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { Button, SearchField, Table } from '@unchainedshop/admin-ui/ui';
import { buyerLabel, matchesTicketFilter } from '../utils/attendees.ts';
import { useAuth } from '@unchainedshop/admin-ui/hooks';
import useAttendeeExport from '../hooks/useAttendeeExport.ts';
import useCancelTicketDialog from '../hooks/useCancelTicketDialog.tsx';
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
  event: event.event,
  texts: event.texts,
});

const eventLabel = (product) => product?.event?.category || product?.texts?.title || '-';

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
  const { hasRole } = useAuth();
  const canCancel = hasRole('cancelTicket');
  const onCancel = useCancelTicketDialog();
  const exportAttendees = useAttendeeExport();

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
    <div className="overflow-hidden rounded-md bg-surface shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-b-border-subtle p-5">
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
        <div className="flex w-full max-w-lg items-center gap-3">
          <div className="min-w-0 flex-1">
            <SearchField onInputChange={setFilter} defaultValue={filter} />
          </div>
          <Button
            variant="secondary"
            disabled={!tokens.length}
            text={formatMessage({ id: 'export_attendees_csv', defaultMessage: 'Export CSV' })}
            onClick={() =>
              exportAttendees(tokens, events.map((event) => event.texts?.title || event._id).join('-'))
            }
          />
        </div>
      </div>

      {!matches.length ? (
        <p className="p-5 text-sm text-text-muted">
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
                    <div className="flex justify-end gap-2">
                      {canCancel && (
                        <Button
                          variant="danger"
                          size="sm"
                          text={formatMessage({ id: 'cancel_ticket', defaultMessage: 'Cancel' })}
                          onClick={() => onCancel(token._id)}
                        />
                      )}
                      <Button
                        variant="success"
                        size="sm"
                        disabled={busy}
                        text={formatMessage({ id: 'gate_redeem', defaultMessage: 'Redeem' })}
                        onClick={() => onRedeem(token)}
                      />
                    </div>
                  )}
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table>
      )}
      {matches.length > MAX_ROWS && (
        <p className="p-5 text-sm text-text-muted">
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
