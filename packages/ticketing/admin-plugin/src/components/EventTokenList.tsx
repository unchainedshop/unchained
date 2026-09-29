import { useIntl } from 'react-intl';
import { Table } from '@unchainedshop/admin-ui/ui';
import EventTokenListItem from './EventTokenListItem.tsx';

const EventTokenList = ({ tokens, onCancelTicket, onRedeemTicket }) => {
  const { formatMessage } = useIntl();

  if (!tokens?.length) {
    return (
      <p className="py-4 text-sm text-text-muted">
        {formatMessage({
          id: 'no_tickets_issued',
          defaultMessage: 'No tickets have been issued yet.',
        })}
      </p>
    );
  }

  return (
    <Table className="min-w-full">
      <Table.Row header>
        <Table.Cell>{formatMessage({ id: 'ticket_number', defaultMessage: 'Ticket #' })}</Table.Cell>
        <Table.Cell>{formatMessage({ id: 'attendee', defaultMessage: 'Attendee' })}</Table.Cell>
        <Table.Cell>{formatMessage({ id: 'ticket_buyer', defaultMessage: 'Buyer' })}</Table.Cell>
        <Table.Cell>{formatMessage({ id: 'ticket_status', defaultMessage: 'Status' })}</Table.Cell>
        <Table.Cell>{formatMessage({ id: 'actions', defaultMessage: 'Actions' })}</Table.Cell>
      </Table.Row>
      {tokens.map((token) => (
        <EventTokenListItem
          key={token._id}
          token={token}
          onCancelTicket={onCancelTicket}
          onRedeemTicket={onRedeemTicket}
        />
      ))}
    </Table>
  );
};

export default EventTokenList;
