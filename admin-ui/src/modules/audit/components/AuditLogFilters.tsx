import { useIntl } from 'react-intl';
import { useRouter } from 'next/router';
import StatusFilter from '../../common/components/StatusFilter';
import DateInputField from '@/components/ui/DateInput';
import useFormatDateTime from '../../common/utils/useFormatDateTime';
import { normalizeQuery } from '../../common/utils/utils';
import deBounce from '../../common/utils/deBounce';

const CLASS_OPTIONS = [
  { value: '3002', label: 'Authentication' },
  { value: '3001', label: 'Account Change' },
  { value: '6003', label: 'API Activity' },
];

const STATUS_OPTIONS = ['Success', 'Failure'];

const debouncedPush = deBounce(300);

const AuditLogFilters = () => {
  const { formatMessage } = useIntl();
  const { parseDate } = useFormatDateTime();
  const { query, push } = useRouter();

  const selectedStatuses = (() => {
    if (query.success === 'true') return ['Success'];
    if (query.success === 'false') return ['Failure'];
    return [];
  })();

  const onStatusChange = (statuses: string[]) => {
    const { success, ...rest } = query;
    if (statuses.length === 0 || statuses.length === 2) {
      push({ query: rest }, undefined, { shallow: true });
    } else if (statuses.includes('Success')) {
      push({ query: { ...rest, success: 'true' } }, undefined, {
        shallow: true,
      });
    } else {
      push({ query: { ...rest, success: 'false' } }, undefined, {
        shallow: true,
      });
    }
  };

  const appliedClassLabels = ((query.classUids as string) || '')
    .split(',')
    .filter(Boolean)
    .map((uid) => CLASS_OPTIONS.find((o) => o.value === uid)?.label)
    .filter(Boolean) as string[];

  const onClassChange = (labels: string[]) => {
    const { classUids, ...rest } = query;
    if (labels.length === 0) {
      push({ query: rest }, undefined, { shallow: true });
    } else {
      const uids = labels
        .map((l) => CLASS_OPTIONS.find((o) => o.label === l)?.value)
        .filter(Boolean)
        .join(',');
      push({ query: { ...rest, classUids: uids } }, undefined, {
        shallow: true,
      });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="text-md text-slate-600 dark:text-slate-200">
          {formatMessage({
            id: 'filter_by_date',
            defaultMessage: 'Filter by date',
          })}
        </div>
        <div className="mt-2 flex items-center">
          <label className="ml-1 mr-2" htmlFor="audit-from">
            {formatMessage({ id: 'from', defaultMessage: 'From' })}
          </label>
          <DateInputField
            id="audit-from"
            onChange={(value) => {
              if (value) {
                push({
                  query: normalizeQuery(
                    query,
                    new Date(value).toISOString(),
                    'from',
                  ),
                });
              } else {
                const { from, ...rest } = query;
                push({ query: { ...rest } });
              }
            }}
            placeholder={formatMessage({
              id: 'start_date',
              defaultMessage: 'Start date',
            })}
            value={query?.from ? parseDate(query?.from) : null}
            containerClassName="w-full"
          />
          <label className="mr-2 ml-3" htmlFor="audit-until">
            {formatMessage({ id: 'to', defaultMessage: 'To' })}
          </label>
          <DateInputField
            id="audit-until"
            onChange={(value) => {
              if (value) {
                push({
                  query: normalizeQuery(
                    query,
                    new Date(value).toISOString(),
                    'until',
                  ),
                });
              } else {
                const { until, ...rest } = query;
                push({ query: { ...rest } });
              }
            }}
            placeholder={formatMessage({
              id: 'end_date',
              defaultMessage: 'End Date',
            })}
            value={
              query?.until ? parseDate(query?.until) : parseDate(new Date())
            }
            containerClassName="w-full"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-8">
        <div>
          <div className="text-md text-slate-800 dark:text-slate-200">
            {formatMessage({ id: 'class', defaultMessage: 'Class' })}
          </div>
          <div className="flex flex-wrap gap-5">
            <StatusFilter
              onStatusChange={onClassChange}
              selectedStatuses={appliedClassLabels}
              statuses={CLASS_OPTIONS.map((o) => o.label)}
            />
          </div>
        </div>

        <div>
          <div className="text-md text-slate-800 dark:text-slate-200">
            {formatMessage({ id: 'status', defaultMessage: 'Status' })}
          </div>
          <div className="flex flex-wrap gap-5">
            <StatusFilter
              onStatusChange={onStatusChange}
              selectedStatuses={selectedStatuses}
              statuses={STATUS_OPTIONS}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-48">
          <label
            htmlFor="audit-search"
            className="text-md text-slate-600 dark:text-slate-200"
          >
            {formatMessage({
              id: 'filter_by_message',
              defaultMessage: 'Search messages',
            })}
          </label>
          <div className="relative mt-2">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg
                className="h-5 w-5 text-slate-400 dark:text-slate-200"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <input
              id="audit-search"
              type="search"
              defaultValue={(query.queryText as string) || ''}
              placeholder={formatMessage({
                id: 'search_messages_placeholder',
                defaultMessage: 'Search by message or operation...',
              })}
              className="block w-full rounded-md border border-slate-300 dark:border-slate-700 text-slate-900 dark:bg-slate-900 dark:text-slate-200 py-2 pl-10 pr-3 shadow-xs placeholder:text-slate-400 dark:placeholder:text-slate-400 focus:ring-2 focus:ring-slate-800 focus:outline-hidden text-sm"
              onChange={(e) => {
                const value = e.target.value;
                debouncedPush(() => {
                  const { queryText, ...rest } = query;
                  if (value) {
                    push({ query: { ...rest, queryText: value } }, undefined, {
                      shallow: true,
                    });
                  } else {
                    push({ query: rest }, undefined, { shallow: true });
                  }
                });
              }}
            />
          </div>
        </div>

        <div className="flex-1 min-w-48">
          <label
            htmlFor="audit-user-id"
            className="text-md text-slate-600 dark:text-slate-200"
          >
            {formatMessage({
              id: 'filter_by_user',
              defaultMessage: 'Filter by user ID',
            })}
          </label>
          <div className="mt-2">
            <input
              id="audit-user-id"
              type="text"
              placeholder={formatMessage({
                id: 'audit_filter_user_id',
                defaultMessage: 'Enter user ID...',
              })}
              className="block w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm shadow-xs text-slate-900 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-800"
              value={(query.userId as string) || ''}
              onChange={(e) => {
                const { userId, ...rest } = query;
                if (e.target.value) {
                  push(
                    { query: { ...rest, userId: e.target.value } },
                    undefined,
                    { shallow: true },
                  );
                } else {
                  push({ query: rest }, undefined, { shallow: true });
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogFilters;
