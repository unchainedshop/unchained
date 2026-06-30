import React from 'react';
import { useIntl } from 'react-intl';

import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import Badge from '@/components/ui/Badge';

export const InterfaceItemCompact = ({ iface }) => {
  const { formatMessage } = useIntl();

  return (
    <div className="relative border rounded-xl p-4 shadow-sm bg-surface-input flex items-start gap-4 w-full">
      <div className="shrink-0 mt-1 text-slate-500 dark:text-slate-300">
        <Cog6ToothIcon className="w-7 h-7" />
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-text-primary truncate">
            {iface.label}
          </h3>
        </div>

        <div className="flex items-center flex-wrap gap-3 text-xs text-text-muted">
          <Badge text={iface.version} square dotted />
          <span className="bg-surface-raised px-2 py-1 rounded truncate">
            {formatMessage({ id: 'id', defaultMessage: 'ID' })}: {iface._id}
          </span>
        </div>
      </div>
    </div>
  );
};

const CopilotProviderInterfaceList = ({ interfaces }) => {
  if (!interfaces?.length) return null;

  return interfaces.map((iface) => (
    <InterfaceItemCompact key={iface._id} iface={iface} />
  ));
};

export default CopilotProviderInterfaceList;
