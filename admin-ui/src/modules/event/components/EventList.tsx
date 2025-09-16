import { useIntl } from 'react-intl';
import Table from '../../common/components/Table';
import EventListItem from './EventListItem';

const EventList = ({ events, sortable }) => {
  const { formatMessage } = useIntl();
  return (
    <Table className="min-w-full ">
      {events?.map((event) => (
        <Table.Row key={event._id} header enablesort={sortable}>
          <Table.Cell sortKey="type">
            {formatMessage({ id: 'type', defaultMessage: 'Type' })}
          </Table.Cell>
          <Table.Cell sortKey="created">
            {formatMessage({
              id: 'created',
              defaultMessage: 'Created',
            })}
          </Table.Cell>
        </Table.Row>
      ))}

      {events?.map((event) => (
        <EventListItem
          key={`${event?._id}-body${event.created}`}
          event={event}
        />
      ))}
    </Table>
  );
};

export default EventList;
