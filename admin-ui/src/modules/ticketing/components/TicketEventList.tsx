import { useIntl } from 'react-intl';
import Table from '../../common/components/Table';
import TicketEventListItem from './TicketEventListItem';

const TicketEventList = ({ products }) => {
  const { formatMessage } = useIntl();

  return (
    <Table className="min-w-full">
      <Table.Row header>
        <Table.Cell>{' '}</Table.Cell>
        <Table.Cell>
          {formatMessage({ id: 'title', defaultMessage: 'Title' })}
        </Table.Cell>
        <Table.Cell>
          {formatMessage({
            id: 'event_date',
            defaultMessage: 'Event Date',
          })}
        </Table.Cell>
        <Table.Cell>
          {formatMessage({
            id: 'tickets_sold',
            defaultMessage: 'Tickets Sold',
          })}
        </Table.Cell>
        <Table.Cell>
          {formatMessage({ id: 'status', defaultMessage: 'Status' })}
        </Table.Cell>
      </Table.Row>
      {(products || []).map((product) => (
        <TicketEventListItem product={product} key={product?._id} />
      ))}
    </Table>
  );
};

export default TicketEventList;
