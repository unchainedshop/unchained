import React from 'react';

const ConfigurationDisplay = ({ configuration }) => {
  if (!configuration || configuration.length === 0) return null;
  return (
    <div className="p-3 bg-surface rounded-lg shadow-inner border border-border-subtle">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-text-secondary">
        {JSON.parse(configuration)?.map(({ key, value }) => (
          <div
            key={key}
            className="flex justify-between items-center gap-2 truncate"
          >
            <span className="font-medium text-text-secondary truncate">
              {key}
            </span>
            <span className="truncate text-right text-text-muted">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConfigurationDisplay;
