import React from 'react';
import { useIntl } from 'react-intl';
import Link from 'next/link';

const CopilotWorkerActiveTypesItem = ({ type }) => {
  const { formatMessage } = useIntl();
  return (
    <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
          {type.replace(/_/g, ' ')}
        </h3>
      </div>
      <Link
        href={`/works/?types=${encodeURIComponent(type)}`}
        className="px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
      >
        {formatMessage({ id: 'view', defaultMessage: 'View' })}
      </Link>
    </div>
  );
};

const CopilotWorkerActiveTypes = ({ activeTypes }) => {
  const { formatMessage } = useIntl();

  if (!activeTypes?.length) {
    return (
      <div className="p-4 text-center text-slate-500">
        {formatMessage({
          id: 'no_active_types',
          defaultMessage: 'No active worker types found',
        })}
      </div>
    );
  }

  return (
    <div className="w-full space-y-1">
      <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
        {formatMessage(
          {
            id: 'active_types',
            defaultMessage: 'Active Worker Types ({count})',
          },
          { count: activeTypes.length },
        )}
      </h2>
      {activeTypes.map((type) => (
        <CopilotWorkerActiveTypesItem key={type} type={type} />
      ))}
    </div>
  );
};

export default CopilotWorkerActiveTypes;
