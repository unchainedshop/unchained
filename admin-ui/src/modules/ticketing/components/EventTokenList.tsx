import { useIntl } from 'react-intl';
import Table from '../../common/components/Table';
import EventTokenListItem from './EventTokenListItem';

const EventTokenList = ({ tokens, onCancelTicket, onInvalidateTicket }) => {
  const { formatMessage } = useIntl();

  if (!tokens?.length) {
    return (
      <p className="py-4 text-sm text-slate-500 dark:text-slate-400">
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
        <Table.Cell>
          {formatMessage({
            id: 'ticket_number',
            defaultMessage: 'Ticket #',
          })}
        </Table.Cell>
        <Table.Cell>
          {formatMessage({
            id: 'attendee',
            defaultMessage: 'Attendee',
          })}
        </Table.Cell>
        <Table.Cell>
          {formatMessage({
            id: 'email',
            defaultMessage: 'E-Mail',
          })}
        </Table.Cell>
        <Table.Cell>
          {formatMessage({
            id: 'phone',
            defaultMessage: 'Phone',
          })}
        </Table.Cell>
        <Table.Cell>
          {formatMessage({
            id: 'redeemed',
            defaultMessage: 'Redeemed',
          })}
        </Table.Cell>
        <Table.Cell>
          {formatMessage({
            id: 'actions',
            defaultMessage: 'Actions',
          })}
        </Table.Cell>
      </Table.Row>
      {tokens.map((token) => (
        <EventTokenListItem
          key={token._id}
          token={token}
          onCancelTicket={onCancelTicket}
          onInvalidateTicket={onInvalidateTicket}
        />
      ))}
    </Table>
  );
};

export default EventTokenList;
