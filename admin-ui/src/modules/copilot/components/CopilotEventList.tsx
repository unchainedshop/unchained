import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import useFormatDateTime from '../../common/utils/useFormatDateTime';
import Link from 'next/link';
import JSONView from './JSONView';
import CopyableId from './shared/CopyableId';

export const CopilotEventListItem = ({ event: evt }) => {
  const { formatDateTime } = useFormatDateTime();
  const { formatMessage } = useIntl();
  const [showPayload, setShowPayload] = useState(false);

  return (
    <div
      key={evt._id}
      className="flex flex-col p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700"
    >
      <div className="flex justify-between items-center">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">
            {evt.type}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {evt.payload.type}
          </p>
          <CopyableId
            id={evt._id}
            className="text-[11px] text-slate-400 dark:text-slate-500 break-all"
          />
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 text-right whitespace-nowrap mr-4">
          {formatDateTime(evt.created, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </div>

        <div className="flex flex-col text-xs items-end space-y-1">
          <Link
            href={`/events?eventId=${evt._id}`}
            className="px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
          >
            {formatMessage({ id: 'view', defaultMessage: 'View' })}
          </Link>

          <button
            onClick={() => setShowPayload(!showPayload)}
            className="px-2 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            {showPayload
              ? formatMessage({
                  id: 'hide_payload',
                  defaultMessage: 'Hide Payload',
                })
              : formatMessage({
                  id: 'show_payload',
                  defaultMessage: 'Show Payload',
                })}
          </button>
        </div>
      </div>

      {showPayload && <JSONView data={evt?.payload} />}
    </div>
  );
};

const CopilotEventList = ({ events, toolCallId }) => {
  const { formatMessage } = useIntl();
  if (!events?.length) {
    return (
      <div className="p-4 text-center text-slate-500">
        {formatMessage({
          id: 'no_event_found',
          defaultMessage: 'No event found',
        })}
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      {events
        .sort(
          (a, b) =>
            new Date(b.created).getTime() - new Date(a.created).getTime(),
        )
        .map((evt) => (
          <CopilotEventListItem key={`${evt._id}-${toolCallId}`} event={evt} />
        ))}
    </div>
  );
};

export default CopilotEventList;
