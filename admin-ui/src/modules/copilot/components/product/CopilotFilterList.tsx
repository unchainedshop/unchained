import React from 'react';
import { useIntl } from 'react-intl';
import useFormatDateTime from '../../../common/utils/useFormatDateTime';
import Link from 'next/link';
import CopyableId from '../shared/CopyableId';

export const CopilotFilterItem = ({ filter, toolCallId = '' }) => {
  const { formatMessage } = useIntl();
  const { formatDateTime } = useFormatDateTime();
  return (
    <div className="relative border rounded-xl p-4 shadow-sm bg-white dark:bg-slate-900 space-y-4 w-full">
      <Link
        href={`/filters?filterId=${filter._id}`}
        className="absolute top-2 right-2 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
      >
        {formatMessage({ id: 'edit', defaultMessage: 'Edit' })}
      </Link>
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
            {filter.texts?.name || filter.key}
          </h3>
          <CopyableId id={filter._id} />

          <div className="flex items-center gap-2 mt-1 text-xs">
            <span className="bg-slate-100 dark:bg-slate-600 text-slate-500 dark:text-slate-300 px-2 py-0.5 rounded">
              {filter.type}
            </span>
            {typeof filter.sortKey === 'number' && (
              <span className="bg-purple-100 text-purple-700 dark:bg-purple-800 dark:text-purple-200 px-2 py-0.5 rounded">
                {formatMessage({
                  id: 'filter.sortKey',
                  defaultMessage: 'Sort',
                })}
                : {filter.sortKey}
              </span>
            )}
          </div>

          {filter.options?.length > 0 && (
            <div className="mt-2">
              <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {formatMessage({
                  id: 'filter.options',
                  defaultMessage: 'Options',
                })}
                :
              </div>
              <div className="flex flex-wrap gap-1">
                {filter.options.map((opt) => (
                  <span
                    key={`${toolCallId}-${opt.filterOption}`}
                    className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${
                      opt.isActive
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                    }`}
                  >
                    {opt.filterOption || opt.key}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap mt-8 gap-1">
          <span
            className={`text-xs font-medium rounded px-2 py-0.5 ${
              filter.isActive
                ? 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200'
                : 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200'
            }`}
          >
            {filter.isActive
              ? formatMessage({
                  id: 'active',
                  defaultMessage: 'Active',
                })
              : formatMessage({
                  id: 'inactive',
                  defaultMessage: 'Inactive',
                })}
          </span>
          <span>
            {formatMessage({ id: 'created', defaultMessage: 'Created' })}:{' '}
            {formatDateTime(filter.created)}
          </span>
          {filter.updated && (
            <span>
              {formatMessage({
                id: 'updated',
                defaultMessage: 'Updated',
              })}
              : {formatDateTime(filter.updated)}
            </span>
          )}
          {filter.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1 justify-end">
              {filter.tags.map((tag) => (
                <span
                  key={`${toolCallId}-${tag}`}
                  className="bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200 px-2 py-0.5 rounded text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CopilotFilterList = ({ filters, toolCallId = '' }) => {
  if (!filters?.length) return null;

  return (
    <div className="flex flex-col gap-3 w-full">
      {filters.map((filter) => (
        <CopilotFilterItem
          key={`${toolCallId}-${filter._id}`}
          filter={filter}
          toolCallId={toolCallId}
        />
      ))}
    </div>
  );
};

export default CopilotFilterList;
