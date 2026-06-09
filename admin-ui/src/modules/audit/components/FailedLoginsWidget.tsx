import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import useFailedLoginAttempts from '../hooks/useFailedLoginAttempts';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const FailedLoginsWidget = () => {
  const { formatMessage } = useIntl();
  const { oneDayAgo, oneWeekAgo } = useMemo(() => {
    const now = Date.now();
    return {
      oneDayAgo: now - 24 * 60 * 60 * 1000,
      oneWeekAgo: now - 7 * 24 * 60 * 60 * 1000,
    };
  }, []);

  const {
    failedLoginAttempts: last24h,
    loading: loading24h,
    error: error24h,
  } = useFailedLoginAttempts({ since: oneDayAgo });
  const {
    failedLoginAttempts: last7d,
    loading: loading7d,
    error: error7d,
  } = useFailedLoginAttempts({ since: oneWeekAgo });

  const loading = loading24h || loading7d;
  const error = error24h || error7d;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center gap-2 mb-3">
        <ExclamationTriangleIcon className="h-5 w-5 text-slate-500" />
        <h3 className="font-semibold text-slate-800 dark:text-slate-200">
          {formatMessage({
            id: 'failed_login_attempts',
            defaultMessage: 'Failed login attempts',
          })}
        </h3>
      </div>
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">
          {formatMessage({
            id: 'failed_login_error',
            defaultMessage: 'Failed to load login data',
          })}
        </p>
      ) : loading ? (
        <div className="animate-pulse h-12 bg-slate-100 dark:bg-slate-700 rounded" />
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {last24h}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {formatMessage({
                id: 'last_24_hours',
                defaultMessage: 'Last 24 hours',
              })}
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {last7d}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {formatMessage({
                id: 'last_7_days',
                defaultMessage: 'Last 7 days',
              })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FailedLoginsWidget;
