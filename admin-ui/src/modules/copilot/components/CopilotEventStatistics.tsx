import React from 'react';
import { useIntl } from 'react-intl';

const CopilotEventStatistics = ({ statistics }) => {
  const { formatMessage } = useIntl();

  if (!statistics?.length) {
    return (
      <div className="p-4 text-center text-slate-500">
        {formatMessage({
          id: 'no_statistics_available',
          defaultMessage: 'No statistics available',
        })}
      </div>
    );
  }

  const sortedStats = [...statistics].sort((a, b) =>
    a.type.localeCompare(b.type),
  );

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {sortedStats.map((stat) => (
        <div
          key={stat.type}
          className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col items-center"
        >
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {stat.emitCount}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center break-words">
            {stat.type}
          </p>
        </div>
      ))}
    </div>
  );
};

export default CopilotEventStatistics;
