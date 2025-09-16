import React from 'react';
import { CommandLineIcon } from '@heroicons/react/24/outline';
import { useChatContext } from '..';

const LoadingIndicator: React.FC = () => {
  const { status } = useChatContext();
  const loadingMessages = {
    submitted: 'Processing...',
    streaming: 'Generating...',
  };

  // Don't render if status is ready
  if (status === 'ready') {
    return null;
  }

  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-800 dark:from-slate-500 dark:to-slate-700 rounded-lg flex items-center justify-center shadow-sm">
        <CommandLineIcon className="w-5 h-5 text-white animate-pulse" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Copilot
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500 dark:text-slate-400 italic transition-opacity duration-300">
            {loadingMessages[status]}
          </span>
          <div className="flex gap-1">
            <div
              className="w-2 h-2 bg-slate-300 dark:bg-slate-600 rounded-full animate-bounce"
              style={{ animationDelay: '0ms' }}
            />
            <div
              className="w-2 h-2 bg-slate-300 dark:bg-slate-600 rounded-full animate-bounce"
              style={{ animationDelay: '150ms' }}
            />
            <div
              className="w-2 h-2 bg-slate-300 dark:bg-slate-600 rounded-full animate-bounce"
              style={{ animationDelay: '300ms' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingIndicator;
