import React from 'react';

const ConfigurationDisplay = ({ configuration }) => {
  if (!configuration || configuration.length === 0) return null;
  return (
    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg shadow-inner border border-slate-200 dark:border-slate-700">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
        {JSON.parse(configuration)?.map(({ key, value }) => (
          <div
            key={key}
            className="flex justify-between items-center gap-2 truncate"
          >
            <span className="font-medium text-slate-700 dark:text-slate-200 truncate">
              {key}
            </span>
            <span className="truncate text-right text-slate-500 dark:text-slate-400">
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConfigurationDisplay;
