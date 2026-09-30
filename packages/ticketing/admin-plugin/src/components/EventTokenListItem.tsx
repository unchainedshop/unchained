import Link from 'next/link';
import { useIntl } from 'react-intl';
import { Button, Table, MediaAvatar } from '@unchainedshop/admin-ui/ui';
import { buyerLabel } from '../utils/attendees.ts';
import TicketStatusBadge from './TicketStatusBadge.tsx';
import BuyerContact from './BuyerContact.tsx';

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
        <BuyerContact user={token.user} className="mt-1" />
      </Table.Cell>
      <Table.Cell>
        <TicketStatusBadge token={token} />
      </Table.Cell>
      <Table.Cell>
        {isValid && (
          <div className="flex items-center gap-2">
            {onCancelTicket && (
              <Button
                variant="danger"
                size="sm"
                text={formatMessage({ id: 'cancel_ticket', defaultMessage: 'Cancel' })}
                onClick={() => onCancelTicket(token._id)}
              />
            )}
            {onRedeemTicket && (
              <Button
                variant="success"
                size="sm"
                text={formatMessage({ id: 'redeem_ticket', defaultMessage: 'Redeem' })}
                onClick={() => onRedeemTicket(token._id)}
              />
            )}
          </div>
        )}
      </Table.Cell>
    </Table.Row>
  );
};

export default EventTokenListItem;
