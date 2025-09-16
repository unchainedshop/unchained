import React, { useState } from 'react';
import { useIntl } from 'react-intl';

const CopyableId = ({
  id,
  label = null,
  className = 'text-xs text-slate-500 dark:text-slate-400',
}) => {
  const { formatMessage } = useIntl();
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const displayLabel =
    label || formatMessage({ id: 'id', defaultMessage: 'ID' });

  return (
    <div className="relative inline-block group bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs text-slate-500 dark:text-slate-400">
      <button
        onClick={copyToClipboard}
        className={`${className} hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer transition-colors truncate text-left`}
      >
        {displayLabel}:{' '}
        {copied ? (
          <span className="text-green-600 dark:text-green-400">
            {formatMessage({ id: 'copied', defaultMessage: 'Copied!' })}
          </span>
        ) : (
          <span className="font-mono">{id}</span>
        )}
      </button>

      {!copied && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
          {formatMessage({
            id: 'click_to_copy',
            defaultMessage: 'Click to copy ID',
          })}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900 dark:border-t-slate-700"></div>
        </div>
      )}
    </div>
  );
};

export default CopyableId;
