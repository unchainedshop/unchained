import React from 'react';
import { useIntl } from 'react-intl';

const CopilotErrorState = ({ onRetry }: { onRetry: () => void }) => {
  const { formatMessage } = useIntl();
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
      <div className="py-16 text-center max-w-lg mx-auto">
        <p className="mt-2 text-sm text-rose-400 dark:text-rose-300">
          {formatMessage({
            id: 'chat_error_retry_message',
            defaultMessage:
              'An error occurred while processing your request, please reload the  conversation and submit something shorter.',
          })}
        </p>
        <button
          onClick={onRetry}
          className="mt-6 bg-white hover:bg-slate-950 text-slate-950 hover:text-white dark:hover:text-white rounded-sm shadow-sm hover:shadow-lg py-2 px-4 border border-slate-950 dark:border-slate-200 hover:border-transparent"
        >
          {formatMessage({ id: 'retry_prompt', defaultMessage: 'Retry' })}
        </button>
      </div>
    </div>
  );
};

export default React.memo(CopilotErrorState);
