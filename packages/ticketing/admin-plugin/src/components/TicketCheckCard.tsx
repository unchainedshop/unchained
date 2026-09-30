import { useIntl } from 'react-intl';
import { Button } from '@unchainedshop/admin-ui/ui';
import { AlertNotice } from './Notice.tsx';
import { buyerLabel } from '../utils/attendees.ts';
import { useFormatDateTime } from '../utils/misc.ts';
import { getScanTone, TicketVerdict, type GateOutcome } from '../utils/scan.ts';

// Inline colours: the result must be readable from a distance whatever the host stylesheet holds.
const TONE_COLORS = {
  ok: '#059669',
  warn: '#d97706',
  error: '#e11d48',
};

/** Headline and explanation of a gate verdict, for the result card and for toasts. */
export const useVerdictText = () => {
  const { formatMessage } = useIntl();
  const { formatDateTime } = useFormatDateTime();
  const time = (date?: string) =>
    date ? formatDateTime(date, { dateStyle: 'short', timeStyle: 'short' }) : null;

  return ({ check, ticket, code }: GateOutcome, eventIds?: string[] | null) => {
    switch (check.verdict) {
      case TicketVerdict.VALID:
        return {
          title: formatMessage({ id: 'gate_verdict_valid', defaultMessage: 'Valid ticket' }),
          detail: formatMessage({
            id: 'gate_verdict_valid_detail',
            defaultMessage: 'Not redeemed yet. Redeem it to admit the attendee.',
          }),
        };
      case TicketVerdict.ADMITTED:
        return {
          title: formatMessage({ id: 'gate_verdict_admitted', defaultMessage: 'Admitted' }),
          detail: formatMessage({
            id: 'gate_verdict_admitted_detail',
            defaultMessage: 'The ticket has been redeemed.',
          }),
        };
      case TicketVerdict.ALREADY_REDEEMED:
        return {
          title: formatMessage({ id: 'gate_verdict_redeemed', defaultMessage: 'Already redeemed' }),
          detail: check.date
            ? formatMessage(
                { id: 'gate_verdict_redeemed_at', defaultMessage: 'Redeemed on {date}.' },
                { date: time(check.date) },
              )
            : null,
        };
      case TicketVerdict.CANCELLED:
        return {
          title:
            check.scope === 'EVENT'
              ? formatMessage({ id: 'gate_verdict_event_cancelled', defaultMessage: 'Event cancelled' })
              : formatMessage({ id: 'gate_verdict_cancelled', defaultMessage: 'Ticket cancelled' }),
          detail: check.date
            ? formatMessage(
                { id: 'gate_verdict_cancelled_at', defaultMessage: 'Cancelled on {date}.' },
                { date: time(check.date) },
              )
            : formatMessage({
                id: 'gate_verdict_cancelled_detail',
                defaultMessage: 'This ticket does not admit anyone.',
              }),
        };
      case TicketVerdict.WRONG_EVENT: {
        const product = ticket?.product?._id === check.productId ? ticket?.product : null;
        return {
          title: formatMessage({ id: 'gate_verdict_wrong_event', defaultMessage: 'Wrong event' }),
          // The category tells apart products of one performance that share title and date.
          detail: product?.texts?.title
            ? formatMessage(
                {
                  id: 'gate_verdict_wrong_event_detail',
                  defaultMessage: 'This ticket is for {title} {date}.',
                },
                {
                  title: [product.texts.title, product.event?.category].filter(Boolean).join(' · '),
                  date: time(product.event?.startsAt) || '',
                },
              )
            : formatMessage({
                id: 'gate_verdict_wrong_event_unknown',
                defaultMessage: 'This ticket is for another event.',
              }),
        };
      }
      case TicketVerdict.NOT_REDEEMABLE:
        if (check.reason === 'NOT_YET_OPEN') {
          return {
            title: formatMessage({ id: 'gate_verdict_not_open', defaultMessage: 'Entry not open yet' }),
            detail: check.opensAt
              ? formatMessage(
                  { id: 'gate_verdict_opens_at', defaultMessage: 'Entry opens on {date}.' },
                  { date: time(check.opensAt) },
                )
              : null,
          };
        }
        if (check.reason === 'ENTRY_CLOSED') {
          return {
            title: formatMessage({ id: 'gate_verdict_closed', defaultMessage: 'Entry closed' }),
            detail: check.closesAt
              ? formatMessage(
                  { id: 'gate_verdict_closed_at', defaultMessage: 'Entry closed on {date}.' },
                  { date: time(check.closesAt) },
                )
              : null,
          };
        }
        if (check.reason === 'EVENT_INACTIVE') {
          return {
            title: formatMessage({ id: 'gate_verdict_inactive', defaultMessage: 'Event not active' }),
            detail: formatMessage({
              id: 'gate_verdict_inactive_detail',
              defaultMessage: 'The event is not published, tickets cannot be redeemed.',
            }),
          };
        }
        return {
          title: formatMessage({
            id: 'gate_verdict_not_redeemable',
            defaultMessage: 'Not redeemable now',
          }),
          detail: check.startsAt
            ? formatMessage(
                { id: 'gate_verdict_starts_at', defaultMessage: 'The event starts on {date}.' },
                { date: time(check.startsAt) },
              )
            : null,
        };
      case TicketVerdict.NOT_FOUND:
        return {
          title: formatMessage({ id: 'gate_verdict_not_found', defaultMessage: 'No ticket found' }),
          detail: eventIds?.length
            ? formatMessage(
                {
                  id: 'gate_verdict_not_found_detail',
                  defaultMessage:
                    'Nothing matches "{code}": no ticket id, serial or attendee of the gate\'s events, and no order number.',
                },
                { code },
              )
            : null,
        };
      case TicketVerdict.NOT_A_TICKET:
        return {
          title: formatMessage({ id: 'gate_verdict_not_a_ticket', defaultMessage: 'Not a ticket' }),
          detail: formatMessage({
            id: 'gate_verdict_not_a_ticket_detail',
            defaultMessage:
              'This QR code holds no ticket id with its access key. To look up a serial, name or order number, type it into the search field.',
          }),
        };
      case TicketVerdict.INVALID_CODE:
        return {
          title: formatMessage({
            id: 'gate_verdict_invalid_code',
            defaultMessage: 'Outdated ticket code',
          }),
          detail: formatMessage({
            id: 'gate_verdict_invalid_code_detail',
            defaultMessage:
              'This QR code does not match the ticket any more: it was issued before the ticket changed hands, or it is forged. Ask for the current ticket.',
          }),
        };
      case TicketVerdict.NO_PERMISSION:
        return {
          title: formatMessage({ id: 'gate_verdict_no_permission', defaultMessage: 'Not allowed' }),
          detail: formatMessage({
            id: 'gate_verdict_no_permission_detail',
            defaultMessage:
              'You may not check tickets of this event, or your session has expired. Log in again if this persists.',
          }),
        };
      default:
        return {
          title: formatMessage({ id: 'gate_verdict_error', defaultMessage: 'Check failed' }),
          detail: check.message || null,
        };
    }
  };
};

const Fact = ({ label, children }) => (
  <div>
    <dt className="text-xs font-medium uppercase text-text-muted">{label}</dt>
    <dd className="mt-0.5 text-base text-text-primary">{children}</dd>
  </div>
);

/**
 * The outcome of a scan or lookup at the gate: a coloured verdict (go, look again, stop), the
 * ticket's attendee, buyer and serial, and the redeem button while the ticket is valid. A valid
 * ticket found by search instead of its QR code comes with a reminder to check it first.
 */
const TicketCheckCard = ({
  outcome,
  eventIds,
  busy = false,
  onRedeem,
  onDismiss,
}: {
  outcome: GateOutcome;
  eventIds?: string[] | null;
  busy?: boolean;
  onRedeem?: (ticket: GateOutcome['ticket']) => void;
  onDismiss?: () => void;
}) => {
  const { formatMessage } = useIntl();
  const { formatDateTime } = useFormatDateTime();
  const verdictText = useVerdictText();
  if (!outcome?.check) return null;

  const { check, ticket } = outcome;
  const { title, detail } = verdictText(outcome, eventIds);
  const guest = formatMessage({ id: 'gate_guest', defaultMessage: 'Guest' });
  const quantity = ticket?.quantity || 1;

  return (
    <div role="status" aria-live="assertive" className="overflow-hidden rounded-md bg-surface shadow-sm">
      <div
        style={{
          backgroundColor: TONE_COLORS[getScanTone(check)],
          color: '#fff',
          padding: '1rem 1.25rem',
        }}
      >
        <p style={{ fontSize: '1.75rem', fontWeight: 700, lineHeight: 1.2 }}>{title}</p>
        {detail && <p style={{ marginTop: '0.25rem', fontSize: '1rem' }}>{detail}</p>}
      </div>
      {ticket && (
        <dl className="grid grid-cols-2 gap-4 p-5">
          <Fact label={formatMessage({ id: 'gate_ticket_attendee', defaultMessage: 'Attendee' })}>
            <span className="text-xl font-semibold">{ticket.attendeeName || '-'}</span>
          </Fact>
          <Fact label={formatMessage({ id: 'gate_ticket_buyer', defaultMessage: 'Buyer' })}>
            {buyerLabel(ticket.user, guest) || '-'}
          </Fact>
          <Fact label={formatMessage({ id: 'gate_ticket_number', defaultMessage: 'Ticket #' })}>
            {ticket.tokenSerialNumber || ticket._id.slice(-8)}
          </Fact>
          <Fact label={formatMessage({ id: 'gate_ticket_event', defaultMessage: 'Event' })}>
            {ticket.product?.texts?.title || '-'}
            {ticket.product?.event?.category && (
              <span className="block text-sm text-text-muted">{ticket.product.event?.category}</span>
            )}
            {ticket.product?.event?.startsAt && (
              <span className="block text-sm text-text-muted">
                {formatDateTime(ticket.product.event?.startsAt, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            )}
          </Fact>
          {outcome.matchedBy === 'SEARCH' && check.verdict === TicketVerdict.VALID && (
            <div className="col-span-2">
              <AlertNotice tone="warning">
                {formatMessage({
                  id: 'gate_ticket_found_by_search',
                  defaultMessage:
                    'Found by search, not by its QR code: a serial, name or order number is no proof of holding the ticket. Check the ticket or the attendee before redeeming.',
                })}
              </AlertNotice>
            </div>
          )}
          {quantity > 1 && (
            <div className="col-span-2 font-semibold">
              <AlertNotice tone="warning">
                {formatMessage(
                  {
                    id: 'gate_ticket_quantity',
                    defaultMessage: 'This ticket admits {count} people.',
                  },
                  { count: quantity },
                )}
              </AlertNotice>
            </div>
          )}
        </dl>
      )}
      <div className="flex gap-3 border-t border-t-border-subtle bg-surface-subtle p-5">
        {check.verdict === TicketVerdict.VALID && onRedeem && (
          <Button
            variant="success"
            size="lg"
            fullWidth
            disabled={busy}
            text={formatMessage({ id: 'gate_redeem', defaultMessage: 'Redeem' })}
            onClick={() => onRedeem(ticket)}
          />
        )}
        {onDismiss && (
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            text={formatMessage({ id: 'gate_next_ticket', defaultMessage: 'Next ticket' })}
            onClick={onDismiss}
          />
        )}
      </div>
    </div>
  );
};

export default TicketCheckCard;
