import React from 'react';
import { useIntl } from 'react-intl';
import useFormatDateTime from '../../common/utils/useFormatDateTime';

const CopilotWorkerStatistics = ({ statistics }) => {
  const { formatMessage } = useIntl();
  const { formatDateTime } = useFormatDateTime();

  if (!statistics?.allocationMap?.length) {
    return (
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {formatMessage({
          id: 'worker.noStatistics',
          defaultMessage: 'No statistics available',
        })}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      {statistics.dateRange?.from && statistics.dateRange?.to && (
        <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
          {formatMessage({
            id: 'worker.dateRange',
            defaultMessage: 'Date Range',
          })}
          :
          {` ${formatDateTime(statistics.dateRange.from)} → ${formatDateTime(statistics.dateRange.to)}`}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
        {statistics.allocationMap.map((item) => (
          <div
            key={item.type}
            className="p-2 bg-white dark:bg-slate-800 rounded shadow border border-slate-200 dark:border-slate-700 text-xs flex flex-col gap-1"
          >
            <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
              {formatMessage({
                id: `worker.type.${item.type}`,
                defaultMessage: item.type,
              })}
            </div>
            <div className="flex flex-wrap gap-1">
              <span className="px-1 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-700 dark:text-slate-300">
                {formatMessage({
                  id: 'worker.startCount',
                  defaultMessage: 'Start',
                })}
                : {item.startCount}
              </span>
              <span className="px-1 py-0.5 bg-blue-100 dark:bg-blue-800 rounded text-blue-700 dark:text-blue-200">
                {formatMessage({
                  id: 'worker.successCount',
                  defaultMessage: 'Success',
                })}
                : {item.successCount}
              </span>
              {item.errorCount > 0 && (
                <span className="px-1 py-0.5 bg-red-100 dark:bg-red-800 rounded text-red-700 dark:text-red-200">
                  {formatMessage({
                    id: 'worker.errorCount',
                    defaultMessage: 'Error',
                  })}
                  : {item.errorCount}
                </span>
              )}
              {item.deleteCount > 0 && (
                <span className="px-1 py-0.5 bg-yellow-100 dark:bg-yellow-800 rounded text-yellow-700 dark:text-yellow-200">
                  {formatMessage({
                    id: 'worker.deleteCount',
                    defaultMessage: 'Deleted',
                  })}
                  : {item.deleteCount}
                </span>
              )}
              <span className="px-1 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-700 dark:text-slate-300">
                {formatMessage({
                  id: 'worker.newCount',
                  defaultMessage: 'New',
                })}
                : {item.newCount}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CopilotWorkerStatistics;
