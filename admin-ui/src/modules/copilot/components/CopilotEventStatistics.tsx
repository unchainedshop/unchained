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
          className="p-4 bg-surface rounded-lg shadow-sm border border-border-subtle flex flex-col items-center"
        >
          <p className="text-lg font-semibold text-text-primary">
            {stat.emitCount}
          </p>
          <p className="text-xs text-text-muted text-center break-words">
            {stat.type}
          </p>
        </div>
      ))}
    </div>
  );
};

export default CopilotEventStatistics;
