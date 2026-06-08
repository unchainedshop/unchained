import { useIntl } from 'react-intl';
import { useRouter } from 'next/router';

const CLASS_OPTIONS = [
  { value: '3002', label: 'Authentication' },
  { value: '3001', label: 'Account Change' },
  { value: '6003', label: 'API Activity' },
];

const STATUS_OPTIONS = [
  { value: 'true', label: 'Success' },
  { value: 'false', label: 'Failure' },
];

const AuditLogFilters = () => {
  const { formatMessage } = useIntl();
  const { query, push } = useRouter();

  const updateFilter = (key: string, value: string | null) => {
    const newQuery = { ...query };
    if (value) {
      newQuery[key] = value;
    } else {
      delete newQuery[key];
    }
    delete newQuery.offset;
    push({ query: newQuery }, undefined, { shallow: true });
  };

  return (
    <div className="flex flex-wrap gap-3">
      <select
        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
        value={(query.classUid as string) || ''}
        onChange={(e) => updateFilter('classUid', e.target.value || null)}
      >
        <option value="">
          {formatMessage({
            id: 'audit_filter_all_classes',
            defaultMessage: 'All classes',
          })}
        </option>
        {CLASS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <select
        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
        value={(query.success as string) || ''}
        onChange={(e) => updateFilter('success', e.target.value || null)}
      >
        <option value="">
          {formatMessage({
            id: 'audit_filter_all_statuses',
            defaultMessage: 'All statuses',
          })}
        </option>
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <input
        type="text"
        placeholder={formatMessage({
          id: 'audit_filter_user_id',
          defaultMessage: 'Filter by user ID...',
        })}
        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
        value={(query.userId as string) || ''}
        onChange={(e) => updateFilter('userId', e.target.value || null)}
      />
    </div>
  );
};

export default AuditLogFilters;
