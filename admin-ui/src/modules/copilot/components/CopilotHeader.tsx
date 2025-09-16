import React from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import { useChatContext } from '..';
import { useIntl } from 'react-intl';

const CopilotHeader: React.FC = () => {
  const { formatMessage } = useIntl();
  const { messages, clearHistory } = useChatContext();

  return (
    <header className="p-4 mt-1 flex items-center justify-between max-w-4xl mx-auto w-full">
      <div className="text-xl font-semibold text-slate-900 dark:text-slate-100">
        Unchained
        <span className="font-light ml-1">
          Copilot<span className="text-xs ml-1"> 1.0</span>
        </span>
      </div>
      {messages.length > 0 && (
        <button
          onClick={clearHistory}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-white dark:hover:text-slate-200 border border-transparent hover:border-slate-100 hover:border-slate-300 dark:hover:border-slate-600 rounded-md dark:hover:bg-slate-700 transition-colors"
        >
          <TrashIcon className="h-4 w-4" />
          {formatMessage({
            id: 'clear_history',
            defaultMessage: 'Clear History',
          })}
        </button>
      )}
    </header>
  );
};

export default CopilotHeader;
