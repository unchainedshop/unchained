import { useIntl } from 'react-intl';
import useAuditChainStatus from '../hooks/useAuditChainStatus';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const ChainStatusBanner = () => {
  const { formatMessage } = useIntl();
  const { chainStatus, loading, refetch } = useAuditChainStatus();

  if (loading || !chainStatus) return null;

  const isValid = chainStatus.valid;

  return (
    <div
      className={`rounded-lg border p-4 ${
        isValid
          ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
          : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isValid ? (
            <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
          ) : (
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
          )}
          <div>
            <h3
              className={`font-semibold ${
                isValid
                  ? 'text-green-800 dark:text-green-200'
                  : 'text-red-800 dark:text-red-200'
              }`}
            >
              {isValid
                ? formatMessage({
                    id: 'audit_chain_valid',
                    defaultMessage: 'Audit chain integrity verified',
                  })
                : formatMessage({
                    id: 'audit_chain_invalid',
                    defaultMessage: 'Audit chain integrity compromised',
                  })}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {formatMessage(
                {
                  id: 'audit_chain_entries',
                  defaultMessage: '{checked} of {total} entries verified',
                },
                {
                  checked: chainStatus.checkedEntries,
                  total: chainStatus.totalEntries,
                },
              )}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="btn-secondary text-sm"
          onClick={() => refetch()}
        >
          {formatMessage({
            id: 'audit_chain_reverify',
            defaultMessage: 'Re-verify',
          })}
        </button>
      </div>
      {chainStatus.errors?.length > 0 && (
        <div className="mt-3 space-y-1">
          {chainStatus.errors.map((err, i) => (
            <p key={i} className="text-sm text-red-700 dark:text-red-300">
              #{err.sequenceNumber}: {err.message}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChainStatusBanner;
