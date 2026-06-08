import Link from 'next/link';
import { useIntl } from 'react-intl';
import {
  CLASS_LABELS,
  STATUS_LABELS,
  CLASS_COLORS,
  getActivityName,
} from './ocsf-labels';

const AuditLogTable = ({
  entries,
  onSelectEntry,
}: {
  entries: any[];
  onSelectEntry: (entry: any) => void;
}) => {
  const { formatMessage, formatDate, formatTime } = useIntl();

  if (!entries?.length) {
    return (
      <p className="py-8 text-center text-slate-500 dark:text-slate-400">
        {formatMessage({
          id: 'no_audit_entries',
          defaultMessage: 'No audit log entries found',
        })}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
        <thead className="bg-slate-50 dark:bg-slate-800">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {formatMessage({ id: 'audit_time', defaultMessage: 'Time' })}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {formatMessage({ id: 'audit_class', defaultMessage: 'Class' })}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {formatMessage({
                id: 'audit_activity',
                defaultMessage: 'Activity',
              })}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {formatMessage({
                id: 'audit_message',
                defaultMessage: 'Message',
              })}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {formatMessage({ id: 'audit_user', defaultMessage: 'User' })}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {formatMessage({
                id: 'audit_status',
                defaultMessage: 'Status',
              })}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-900">
          {entries.map((entry) => {
            const userName =
              entry.actor?.user?.name ||
              entry.actor?.user?.emailAddr ||
              entry.actor?.user?.uid ||
              '—';
            const statusLabel = STATUS_LABELS[entry.statusId] || 'Unknown';
            const isFailure = entry.statusId === 2;
            const classColor =
              CLASS_COLORS[entry.className] ||
              'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200';

            return (
              <tr
                key={entry.id}
                className={`cursor-pointer ${
                  isFailure
                    ? 'bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
                onClick={() => onSelectEntry(entry)}
              >
                <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                  {formatDate(entry.time, {
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  {formatTime(entry.time, {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${classColor}`}
                  >
                    {CLASS_LABELS[entry.className] || entry.className}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                  {getActivityName(entry.classUid, entry.activityId)}
                </td>
                <td className="px-4 py-3 text-sm text-slate-800 dark:text-slate-200 max-w-xs truncate">
                  {entry.message || '—'}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                  {entry.actor?.user?.uid ? (
                    <Link
                      href={`/users/?userId=${entry.actor.user.uid}`}
                      className="text-blue-600 hover:underline dark:text-blue-400"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {userName}
                    </Link>
                  ) : (
                    userName
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm">
                  <span
                    className={
                      isFailure
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-slate-600 dark:text-slate-300'
                    }
                  >
                    {statusLabel}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AuditLogTable;
