import { useIntl } from 'react-intl';
import Link from 'next/link';
import Badge from '../../common/components/Badge';
import Table from '../../common/components/Table';
import { WORK_STATUSES } from '../../common/data/miscellaneous';
import useFormatDateTime from '../../common/utils/useFormatDateTime';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const getMessageStatus = (messageWork, childWorks, formatMessage) => {
  if (!childWorks || childWorks.length === 0) {
    return messageWork.status === 'SUCCESS'
      ? formatMessage({ id: 'message_status_sent', defaultMessage: 'Sent' })
      : formatMessage({
          id: 'message_status_processing',
          defaultMessage: 'Processing',
        });
  }

  const hasSuccess = childWorks.some((child) => child.status === 'SUCCESS');
  const allFailed = childWorks.every((child) => child.status === 'FAILED');
  const hasNew = childWorks.some(
    (child) => child.status === 'NEW' || child.status === 'ALLOCATED',
  );

  if (hasNew)
    return formatMessage({
      id: 'message_status_sending',
      defaultMessage: 'Sending',
    });
  if (hasSuccess && !allFailed)
    return formatMessage({ id: 'message_status_sent', defaultMessage: 'Sent' });
  if (allFailed)
    return formatMessage({
      id: 'message_status_undeliverable',
      defaultMessage: 'Undeliverable',
    });

  return formatMessage({
    id: 'message_status_processing',
    defaultMessage: 'Processing',
  });
};

const getMessageStatusColor = (messageWork, childWorks) => {
  if (!childWorks || childWorks.length === 0) {
    return messageWork.status === 'SUCCESS' ? 'green' : 'yellow';
  }

  const hasSuccess = childWorks.some((child) => child.status === 'SUCCESS');
  const allFailed = childWorks.every((child) => child.status === 'FAILED');
  const hasNew = childWorks.some(
    (child) => child.status === 'NEW' || child.status === 'ALLOCATED',
  );

  if (hasNew) return 'blue';
  if (hasSuccess && !allFailed) return 'green';
  if (allFailed) return 'red';

  return 'yellow';
};

const MessageItem = ({
  messageWork,
  childWorks,
  expanded,
  onToggleExpanded,
}) => {
  const { formatMessage } = useIntl();
  const { formatDateTime } = useFormatDateTime();

  const messageStatus = getMessageStatus(
    messageWork,
    childWorks,
    formatMessage,
  );
  const statusColor = getMessageStatusColor(messageWork, childWorks);

  const options: Intl.DateTimeFormatOptions = {
    dateStyle: 'short',
    timeStyle: 'short',
  };

  const childWorksByType: Record<string, number> =
    childWorks?.reduce((acc, child) => {
      if (!acc[child.type]) {
        acc[child.type] = 0;
      }
      acc[child.type]++;
      return acc;
    }, {}) || {};

  const childWorksDescription =
    Object.entries(childWorksByType)
      .map(([type, count]) => `${count} ${type}${count > 1 ? 's' : ''}`)
      .join(', ') ||
    formatMessage({ id: 'no_retries', defaultMessage: 'No retries' });

  return (
    <>
      <Table.Row className="bg-slate-50 dark:bg-slate-800/50">
        <Table.Cell>
          <div className="flex items-center text-sm">
            <button
              onClick={onToggleExpanded}
              className="mr-2 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
            >
              {expanded ? (
                <ChevronDownIcon className="w-4 h-4" />
              ) : (
                <ChevronRightIcon className="w-4 h-4" />
              )}
            </button>
            <Link
              href={`/works?workerId=${messageWork._id}`}
              className="text-slate-900 dark:text-slate-300 font-medium"
            >
              {messageWork?.type}
            </Link>
            <span className="ml-2 text-slate-500 text-xs">
              ({childWorksDescription})
            </span>
          </div>
        </Table.Cell>

        <Table.Cell>
          <Badge text={messageStatus} color={statusColor} square />
        </Table.Cell>

        <Table.Cell>
          <div className="flex items-center text-sm">
            {messageWork.created
              ? formatDateTime(messageWork.created, options)
              : 'n/a'}
          </div>
        </Table.Cell>

        <Table.Cell>
          <div className="flex items-center text-sm">
            {messageWork.scheduled
              ? formatDateTime(messageWork.scheduled, options)
              : 'n/a'}
          </div>
        </Table.Cell>

        <Table.Cell>
          <div className="flex items-center text-sm">
            {messageWork.started
              ? formatDateTime(messageWork.started, options)
              : 'n/a'}
          </div>
        </Table.Cell>

        <Table.Cell>
          <div className="flex items-center text-sm">
            {messageWork.finished
              ? formatDateTime(messageWork.finished, options)
              : 'n/a'}
          </div>
        </Table.Cell>

        <Table.Cell>
          <div className="flex items-center text-sm">-</div>
        </Table.Cell>
      </Table.Row>

      {expanded &&
        childWorks?.map((childWork) => (
          <Table.Row
            key={childWork._id}
            className="bg-slate-25 dark:bg-slate-900/30"
          >
            <Table.Cell>
              <div className="flex items-center text-sm pl-8">
                <Link
                  href={`/works?workerId=${childWork._id}`}
                  className="text-slate-700 dark:text-slate-400"
                >
                  {childWork.type}
                </Link>
                {childWork.retries > 0 && (
                  <span className="ml-2 text-xs text-orange-600 dark:text-orange-400">
                    (
                    {formatMessage({
                      id: 'retry_remaining',
                      defaultMessage: 'retry',
                    })}{' '}
                    {childWork.retries})
                  </span>
                )}
              </div>
            </Table.Cell>

            <Table.Cell>
              <Badge
                text={childWork.status}
                color={WORK_STATUSES[childWork.status]}
                square
              />
            </Table.Cell>

            <Table.Cell>
              <div className="flex items-center text-sm">
                {childWork.created
                  ? formatDateTime(childWork.created, options)
                  : 'n/a'}
              </div>
            </Table.Cell>

            <Table.Cell>
              <div className="flex items-center text-sm">
                {childWork.scheduled
                  ? formatDateTime(childWork.scheduled, options)
                  : 'n/a'}
              </div>
            </Table.Cell>

            <Table.Cell>
              <div className="flex items-center text-sm">
                {childWork.started
                  ? formatDateTime(childWork.started, options)
                  : 'n/a'}
              </div>
            </Table.Cell>

            <Table.Cell>
              <div className="flex items-center text-sm">
                {childWork.finished
                  ? formatDateTime(childWork.finished, options)
                  : 'n/a'}
              </div>
            </Table.Cell>

            <Table.Cell>
              <div className="flex items-center text-sm">-</div>
            </Table.Cell>
          </Table.Row>
        ))}
    </>
  );
};

const MessagesList = ({
  messageGroups,
  sortable,
  expandedMessages,
  onToggleExpanded,
}) => {
  const { formatMessage } = useIntl();

  return (
    <Table className="min-w-full">
      <Table.Row header enablesort={sortable}>
        <Table.Cell sortKey="type">
          {formatMessage({
            id: 'work_type_header',
            defaultMessage: 'Type',
          })}
        </Table.Cell>

        <Table.Cell sortKey="status">
          {formatMessage({ id: 'status', defaultMessage: 'Status' })}
        </Table.Cell>

        <Table.Cell sortKey="created">
          {formatMessage({
            id: 'created',
            defaultMessage: 'Created',
          })}
        </Table.Cell>

        <Table.Cell sortKey="scheduled" defaultSortDirection="DESC">
          {formatMessage({
            id: 'scheduled',
            defaultMessage: 'Scheduled',
          })}
        </Table.Cell>

        <Table.Cell sortKey="started">
          {formatMessage({
            id: 'started',
            defaultMessage: 'Started',
          })}
        </Table.Cell>

        <Table.Cell sortKey="finished">
          {formatMessage({
            id: 'finished',
            defaultMessage: 'Finished',
          })}
        </Table.Cell>

        <Table.Cell>
          {formatMessage({
            id: 'duration',
            defaultMessage: 'Duration',
          })}
        </Table.Cell>
      </Table.Row>

      {messageGroups?.map((group) => (
        <MessageItem
          key={group.message._id}
          messageWork={group.message}
          childWorks={group.children}
          expanded={expandedMessages.has(group.message._id)}
          onToggleExpanded={() => onToggleExpanded(group.message._id)}
        />
      ))}
    </Table>
  );
};

export default MessagesList;
