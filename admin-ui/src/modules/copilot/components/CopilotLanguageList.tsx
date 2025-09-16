import React from 'react';
import { ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { normalizeLanguageISOCode } from '../../common/utils/utils';
import { useIntl } from 'react-intl';
import useFormatDateTime from '../../common/utils/useFormatDateTime';
import getFlagEmoji from '../../common/utils/getFlagEmoji';
import Link from 'next/link';
import CopyableId from './shared/CopyableId';

export const LanguageItemCompact = ({ language }) => {
  const { locale, formatMessage } = useIntl();
  const { formatDateTime } = useFormatDateTime();
  const flag = getFlagEmoji(language.isoCode);

  return (
    <div className="relative border rounded-xl p-4 shadow-sm bg-white dark:bg-slate-900 space-y-4">
      <Link
        href={`/language?languageId=${language._id}`}
        className="absolute top-2 right-2 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
      >
        {formatMessage({ id: 'edit', defaultMessage: 'Edit' })}
      </Link>

      <div className="flex items-start gap-4">
        <div className="w-12 h-12 flex-shrink-0 bg-slate-100 dark:bg-slate-700 rounded-md flex items-center justify-center text-xl">
          {flag || <ChatBubbleLeftIcon className="w-6 h-6 text-blue-500" />}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
            {normalizeLanguageISOCode(locale, language.isoCode)}
          </h3>
          <CopyableId id={language._id} />
        </div>

        <div className="flex flex-col items-end text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap mt-8 gap-1">
          <span
            className={`text-xs font-medium rounded px-2 py-0.5 ${
              language.isActive
                ? 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200'
                : 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200'
            }`}
          >
            {language.isActive
              ? formatMessage({ id: 'active', defaultMessage: 'Active' })
              : formatMessage({ id: 'inactive', defaultMessage: 'Inactive' })}
          </span>
          <span>
            {formatMessage({ id: 'created', defaultMessage: 'Created' })}:{' '}
            {formatDateTime(language.created)}
          </span>
          {language.updated && (
            <span>
              {formatMessage({ id: 'updated', defaultMessage: 'Updated' })}:{' '}
              {formatDateTime(language.updated)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const CopilotLanguageList = ({ languages, toolCallId }) => {
  if (!languages?.length) return null;
  return (
    <div className="space-y-3">
      {languages.map((language) => (
        <LanguageItemCompact
          key={`${toolCallId}-${language._id}`}
          language={language}
        />
      ))}
    </div>
  );
};

export default CopilotLanguageList;
