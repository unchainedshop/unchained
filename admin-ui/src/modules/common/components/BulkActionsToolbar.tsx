import React, { useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { XMarkIcon } from '@heroicons/react/20/solid';
import type { BulkActionResult } from '../hooks/useBulkResultHandler';

export interface BulkAction {
  key: string;
  label: string;
  variant?: 'danger' | 'default';
  renderForm?: (props: {
    onSubmit: (data: unknown) => Promise<void>;
    onCancel: () => void;
    loading: boolean;
  }) => React.ReactNode;
  onAction: (
    selectedIds: string[],
    data?: unknown,
  ) => Promise<BulkActionResult | null>;
}

interface BulkActionsToolbarProps {
  selectedCount: number;
  selectedIds: string[];
  onClear: () => void;
  onSelectionChange: (ids: string[]) => void;
  actions: BulkAction[];
}

const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({
  selectedCount,
  selectedIds,
  onClear,
  onSelectionChange,
  actions,
}) => {
  const { formatMessage } = useIntl();
  const [activeAction, setActiveAction] = useState<BulkAction | null>(null);
  const [loading, setLoading] = useState(false);
  const actionInFlight = useRef(false);

  useEffect(() => {
    if (selectedCount === 0) setActiveAction(null);
  }, [selectedCount]);

  const executeAction = async (action: BulkAction, data?: unknown) => {
    if (actionInFlight.current) return null;

    actionInFlight.current = true;
    setLoading(true);
    try {
      const result = await action.onAction(selectedIds, data);
      if (result) {
        if (result.failedIds.length) {
          onSelectionChange(result.failedIds);
        } else {
          onClear();
        }
      }
      return result;
    } finally {
      actionInFlight.current = false;
      setLoading(false);
    }
  };

  const handleAction = async (action: BulkAction) => {
    if (actionInFlight.current) return;
    if (action.renderForm) {
      setActiveAction(action);
      return;
    }
    await executeAction(action);
  };

  const handleFormSubmit = async (data: unknown) => {
    if (!activeAction) return;
    const result = await executeAction(activeAction, data);
    if (result) setActiveAction(null);
  };

  if (selectedCount === 0) return null;

  return (
    <div className="sticky top-0 z-30 bg-white dark:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg px-4 py-3 mb-3 flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 mr-2">
        <span className="bg-slate-800 dark:bg-white text-white dark:text-slate-800 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
          {selectedCount}
        </span>
        <span className="text-sm font-medium">
          {formatMessage(
            {
              id: 'bulk_selected',
              defaultMessage:
                '{count, plural, one {# selected} other {# selected}}',
            },
            { count: selectedCount },
          )}
        </span>
        <button
          type="button"
          disabled={loading}
          onClick={() => {
            if (!actionInFlight.current) onClear();
          }}
          className="ml-1 p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
          aria-label={formatMessage({
            id: 'clear_selection',
            defaultMessage: 'Clear selection',
          })}
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="h-5 w-px bg-slate-300 dark:bg-slate-500 hidden sm:block" />

      <div className="flex flex-wrap items-center gap-2">
        {actions.map((action) => (
          <button
            key={action.key}
            type="button"
            disabled={loading || Boolean(activeAction)}
            onClick={() => handleAction(action)}
            className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors disabled:opacity-50 ${
              action.variant === 'danger'
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white'
            }`}
          >
            {action.label}
          </button>
        ))}
      </div>

      {activeAction?.renderForm && (
        <div className="w-full mt-2 pt-2 border-t border-slate-200 dark:border-slate-600">
          {activeAction.renderForm({
            onSubmit: handleFormSubmit,
            onCancel: () => setActiveAction(null),
            loading,
          })}
        </div>
      )}
    </div>
  );
};

export default BulkActionsToolbar;
