import React from 'react';
import { useIntl } from 'react-intl';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

const CopilotEmptyState = ({ onIntroClick }: { onIntroClick: () => void }) => {
  const { formatMessage } = useIntl();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
        <ChatBubbleLeftRightIcon className="w-8 h-8 text-slate-400 dark:text-slate-500" />
      </div>
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {formatMessage({
            id: 'copilot_welcome_title',
            defaultMessage: 'Welcome to Unchained Copilot',
          })}
        </h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-md">
          {formatMessage({
            id: 'copilot_welcome_description',
            defaultMessage:
              'Your AI assistant is ready to help you manage your Unchained Commerce store.',
          })}
        </p>
      </div>
      <button
        onClick={onIntroClick}
        className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-900 dark:bg-slate-600 dark:hover:bg-slate-500 text-white font-medium rounded-lg transition-colors"
      >
        <ChatBubbleLeftRightIcon className="w-5 h-5" />
        {formatMessage({
          id: 'say_hi_get_to_know_me',
          defaultMessage: 'Say Hi and Get To Know Me',
        })}
      </button>
    </div>
  );
};

export default React.memo(CopilotEmptyState);
