import Link from 'next/link';
import { useIntl } from 'react-intl';
import { Table, MediaAvatar } from '@unchainedshop/admin-ui/ui';
import { buyerLabel } from '../utils/attendees.ts';
import TicketStatusBadge from './TicketStatusBadge.tsx';

// Attendee names come from the ticket (ticketMeta hook of the ticket issuer); the buyer is the
// user's public name, "Guest" when the buyer has none.
const EventTokenListItem = ({ token, onCancelTicket, onRedeemTicket }) => {
  const { formatMessage } = useIntl();
  const guest = formatMessage({ id: 'ticket_guest_buyer', defaultMessage: 'Guest' });
  const buyer = buyerLabel(token.user, guest);
  const isValid = token.ticketStatus === 'VALID';

  return (
    <Table.Row key={token._id}>
      <Table.Cell>
        <span className="font-medium text-text-primary">
          {token.tokenSerialNumber || token._id?.slice(-8)}
        </span>
        {token.quantity > 1 && <span className="ml-1 text-sm text-text-muted">×{token.quantity}</span>}
      </Table.Cell>
      <Table.Cell>
        <span className="text-sm text-text-primary">{token.attendeeName || '-'}</span>
      </Table.Cell>
      <Table.Cell>
        {token.user ? (
          <Link
            href={`/users?userId=${token.user._id}`}
            className="flex items-center text-sm text-text-primary hover:underline"
          >
            <MediaAvatar file={token.user?.avatar} className="mr-2" />
            <span className={buyer === guest ? 'text-text-muted' : undefined}>{buyer}</span>
          </Link>
        ) : (
          <span className="text-sm text-text-muted">-</span>
        )}
      </Table.Cell>
      <Table.Cell>
        <TicketStatusBadge token={token} />
      </Table.Cell>
      <Table.Cell>
        {isValid && (
          <div className="flex items-center gap-2">
            {onCancelTicket && (
              <button
                type="button"
                onClick={() => onCancelTicket(token._id)}
                className="inline-flex items-center rounded-md border border-border-default px-3 py-1 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20"
              >
                {formatMessage({
                  id: 'cancel_ticket',
                  defaultMessage: 'Cancel',
                })}
              </button>
            )}
            {onRedeemTicket && (
              <button
                type="button"
                onClick={() => onRedeemTicket(token._id)}
                className="inline-flex items-center rounded-md border border-border-default px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
              >
                {formatMessage({
                  id: 'redeem_ticket',
                  defaultMessage: 'Redeem',
                })}
              </button>
            )}
          </div>
        )}
      </Table.Cell>
    </Table.Row>
  );
};

export default EventTokenListItem;
