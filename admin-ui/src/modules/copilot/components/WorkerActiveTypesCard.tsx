import React from 'react';
import { useIntl } from 'react-intl';
import Link from 'next/link';

const CopilotWorkerActiveTypesItem = ({ type }) => {
  const { formatMessage } = useIntl();
  return (
    <div className="flex items-center justify-between p-3 bg-surface rounded-lg shadow-sm border border-border-subtle">
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-text-primary truncate">
          {type.replace(/_/g, ' ')}
        </h3>
      </div>
      <Link
        href={`/works/?types=${encodeURIComponent(type)}`}
        className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary border border-border-default rounded-md hover:bg-surface-raised transition-colors flex-shrink-0"
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
      <h2 className="text-sm font-semibold text-text-secondary mb-2">
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
