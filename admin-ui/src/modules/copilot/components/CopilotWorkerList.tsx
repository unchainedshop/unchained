import React from 'react';
import { useIntl } from 'react-intl';
import useFormatDateTime from '../../common/utils/useFormatDateTime';
import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import { WORK_STATUSES } from '../../common/data/miscellaneous';
import CopyableId from './shared/CopyableId';

const normalizeWorkerStatus = (work) => {
  if (work?.deleted) {
    return 'DELETED';
  }
  if (!work?.started && !work?.finished) {
    return 'NEW';
  }
  if (work?.started && !work?.finished) {
    return 'ALLOCATED';
  }
  if (work?.started && work?.finished && work?.success) {
    return 'SUCCESS';
  }
  if (work?.started && work?.finished && !work?.success) {
    return 'FAILED';
  }

  return null;
};

export const CopilotWorkerListItem = ({ work }) => {
  const { formatDateTime } = useFormatDateTime();
  const { formatMessage } = useIntl();
  if (!work) return null;
  const status = normalizeWorkerStatus(work);
  return (
    <div
      key={work._id}
      className="flex justify-between items-center p-3 bg-surface rounded-lg shadow-sm border border-border-subtle"
    >
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-text-primary truncate">
          {work.type}
        </h3>
        <CopyableId
          id={work._id}
          className="text-xs text-text-muted break-all"
        />
        {work.worker && (
          <p className="text-xs text-blue-600 dark:text-blue-300">
            {formatMessage({ id: 'worker', defaultMessage: 'Worker' })}:{' '}
            {work.worker}
          </p>
        )}
      </div>
      <div className="text-xs text-text-muted text-right whitespace-nowrap mr-4">
        <Badge text={status} color={WORK_STATUSES[status]} square />
        <br />
        {formatMessage({ id: 'created', defaultMessage: 'Created' })}:{' '}
        {formatDateTime(work.created, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })}
      </div>
      <div className="flex flex-col items-end">
        <Link
          href={`/works?workerId=${work._id}`}
          className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary border border-border-default rounded-md hover:bg-surface-raised transition-colors flex-shrink-0"
        >
          {formatMessage({ id: 'view', defaultMessage: 'View' })}
        </Link>
      </div>
    </div>
  );
};

const CopilotWorkerList = ({ works, toolCallId }) => {
  const { formatMessage } = useIntl();

  if (!works?.length) {
    return (
      <div className="p-4 text-center text-slate-500">
        {formatMessage({
          id: 'no_works_found',
          defaultMessage: 'No works found',
        })}
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      {works
        .sort(
          (a, b) =>
            new Date(b.scheduled).getTime() - new Date(a.scheduled).getTime(),
        )
        .map((work) => (
          <CopilotWorkerListItem
            key={`${work._id}-${toolCallId}`}
            work={work}
          />
        ))}
    </div>
  );
};

export default CopilotWorkerList;
