import Link from 'next/link';

import { useIntl } from 'react-intl';
import Badge from '../../common/components/Badge';
import Table from '../../common/components/Table';
import useFormatDateTime from '../../common/utils/useFormatDateTime';

const EventListItem = ({ event }) => {
  const { formatMessage } = useIntl();
  const { formatDateTime } = useFormatDateTime();

  return (
    <Table.Row>
      <Table.Cell className="whitespace-nowrap px-6">
        <div className="flex items-center text-sm">
          <Link
            href={`/events?eventId=${event._id}`}
            className="text-slate-900 dark:text-slate-300"
          >
            {event?.type || (
              <>
                {event._id}{' '}
                <Badge
                  color="blue"
                  text={formatMessage({
                    id: 'created',
                    defaultMessage: 'Created',
                  })}
                />
              </>
            )}
          </Link>
        </div>
      </Table.Cell>

      <Table.Cell className="whitespace-nowrap px-6">
        <div className="flex items-center text-sm">
          {formatDateTime(new Date(event.created), {
            dateStyle: 'short',
            timeStyle: 'short',
          })}
        </div>
      </Table.Cell>
    </Table.Row>
  );
};

export default EventListItem;
