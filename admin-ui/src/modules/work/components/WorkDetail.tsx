import { useIntl } from 'react-intl';
import Link from 'next/link';

import { useEffect, useState } from 'react';
import Badge from '../../common/components/Badge';
import useFormatDateTime from '../../common/utils/useFormatDateTime';
import { WORK_STATUSES, getShadowStyle } from '../../common/data/miscellaneous';
import JSONView from '../../common/components/JSONView';
import useFormatWorkDurations from '../hooks/useFormatWorkDurations';
import Tooltip from '../../common/components/ToolTip';
import RetryStatistics from './RetryStatistics';

const WorkDetail = ({ work }) => {
  const { formatMessage } = useIntl();
  const { formatDateTime } = useFormatDateTime();
  const { getDuration, getScheduledTime } = useFormatWorkDurations();
  const [, reRenderComponent] = useState(null);

  useEffect(() => {
    let interval = null;
    if (work && (work.status === 'NEW' || work.status === 'ALLOCATED')) {
      interval = setInterval(() => reRenderComponent(Date.now()), 1000);
    }
    return () => {
      clearInterval(interval);
    };
  }, [work?.status]);

  const options: Intl.DateTimeFormatOptions = {
    timeStyle: 'medium',
    dateStyle: 'long',
  };

  return (
    <div
      className={`rounded-xl xl:-mx-8 mt-10 p-2 sm:p-6 lg:p-8 ${getShadowStyle(work?.status)}`}
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 auto-rows-max">
        <div className="max-h-fit col-span-2 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-md dark:shadow-none sm:p-6 lg:col-span-1 lg:p-8">
          <div className="mb-2 flex flex-wrap items-center justify-between">
            <div className="mr-4 text-base text-slate-500 dark:text-slate-500 ">
              {formatMessage({
                id: 'work_type',
                defaultMessage: 'Work type',
              })}
            </div>
            <div className="mt-2 max-w-prose space-y-5 text-sm">
              {work?.type}
            </div>
          </div>

          <div className="mb-2 flex flex-wrap items-center justify-between">
            <div className="mr-4 text-base text-slate-500 dark:text-slate-500 ">
              {formatMessage({
                id: 'work_status',
                defaultMessage: 'Work Status',
              })}
            </div>
            <Badge text={work?.status} color={WORK_STATUSES[work?.status]} />
          </div>

          <div className="mb-2 flex flex-wrap items-center justify-between">
            <div className="mr-4 text-base text-slate-500 dark:text-slate-500 ">
              {formatMessage({
                id: 'work_priority',
                defaultMessage: 'Priority',
              })}
            </div>
            <div className="mt-2 max-w-prose space-y-5 text-sm ">
              {work?.priority}
            </div>
          </div>

          <div className="mb-2 flex flex-wrap items-center justify-between">
            <div className="mr-4 text-base text-slate-500 dark:text-slate-500 ">
              {formatMessage({
                id: 'work_retries',
                defaultMessage: 'Retries',
              })}
            </div>
            <div className="mt-2 max-w-prose space-y-5 text-sm">
              <RetryStatistics work={work} />
            </div>
          </div>

          <div className="mb-2 flex flex-wrap items-center justify-between">
            <div className="mr-4 text-base text-slate-500 dark:text-slate-500 ">
              {formatMessage({
                id: 'worker',
                defaultMessage: 'Worker',
              })}
            </div>
            <div className="mt-2 max-w-prose space-y-5 text-sm">
              {work?.worker ? (
                <Badge
                  text={formatMessage(
                    {
                      id: 'worker_dynamic',
                      defaultMessage: '{worker}',
                    },
                    {
                      worker: work?.worker,
                    },
                  )}
                  color="purple"
                />
              ) : (
                'n/a'
              )}
            </div>
          </div>

          {work?.retries || work?.original ? (
            <div className="mb-2 flex flex-wrap items-center justify-between">
              <div className="mr-4 text-base text-slate-500 dark:text-slate-500 ">
                {formatMessage({
                  id: 'work_original',
                  defaultMessage: 'Original Work',
                })}
              </div>
              <div className="mt-2 max-w-prose space-y-5 text-sm">
                <Link
                  href={`/works?workerId=${work?.original?._id}`}
                  className="text-slate-900 dark:text-slate-300"
                >
                  {work?.original?._id}
                </Link>
              </div>
            </div>
          ) : (
            ''
          )}
        </div>

        <div className="col-span-2 rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-md dark:shadow-none sm:p-6 lg:col-span-1 lg:p-8">
          <div className="grid grid-cols-2 gap-5">
            <div className="sm:col-span-1">
              <div className="flex text-base text-slate-500 dark:text-slate-500 ">
                {formatMessage({
                  id: 'work_created',
                  defaultMessage: 'Created',
                })}
              </div>
              <div className="flex text-sm">
                {formatDateTime(work?.created, options)}
              </div>
            </div>
            <div className="sm:col-span-1">
              <div className="flex text-base text-slate-500 dark:text-slate-500 ">
                {formatMessage({
                  id: 'work_scheduled',
                  defaultMessage: 'Scheduled',
                })}
              </div>
              <div className="flex text-sm w-100">
                <Tooltip text={formatDateTime(work?.scheduled, options)}>
                  {getScheduledTime(work)}
                </Tooltip>
              </div>
            </div>
            <div className="sm:col-span-1">
              <div className="flex text-base text-slate-500 dark:text-slate-500 ">
                {formatMessage({
                  id: 'work_started',
                  defaultMessage: 'Started',
                })}
              </div>
              <div className="flex text-sm">
                {formatDateTime(work?.started, options)}
              </div>
            </div>
            <div className="sm:col-span-1">
              <div className="flex text-base text-slate-500 dark:text-slate-500 ">
                {formatMessage({
                  id: 'work_finished',
                  defaultMessage: 'Finished',
                })}
              </div>
              <div className="flex text-sm">
                {formatDateTime(work?.finished, options)}
              </div>
            </div>
            <div className="sm:col-span-1">
              <div className="flex text-base text-slate-500 dark:text-slate-500 ">
                {formatMessage({
                  id: 'duration',
                  defaultMessage: 'Duration',
                })}
              </div>
              <div className="flex text-sm">{getDuration(work)}</div>
            </div>
            {work?.deleted && (
              <div className="sm:col-span-1">
                <div className="flex text-base text-slate-500 dark:text-slate-500 ">
                  {formatMessage({
                    id: 'deleted',
                    defaultMessage: 'Deleted',
                  })}
                </div>
                <div className="flex text-sm">
                  {formatDateTime(work?.deleted, options)}
                </div>
              </div>
            )}
          </div>
        </div>

        {work?.error && (
          <div className="rounded-lg shadow-md dark:shadow-none border-2 border-rose-300 dark:border-rose-800 col-span-2 lg:col-span-2 order-first overflow-hidden bg-rose-100 dark:bg-rose-800">
            <div className="px-4 py-5 sm:px-6 border-b border-rose-300 dark:border-rose-800">
              <h3 className="text-lg font-medium leading-6 text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {formatMessage({ id: 'error', defaultMessage: 'Error' })}
              </h3>
            </div>
            <div className="bg-rose-50 dark:bg-rose-950">
              <JSONView
                value={decodeURI(JSON.stringify(work.error, null, 2))}
                disabled
                className="block border-none w-full max-w-full resize-none sm:text-sm text-rose-900 dark:text-rose-100"
              />
            </div>
          </div>
        )}

        {work?.input && (
          <div className="overflow-hidden rounded-lg border border-slate-300 dark:border-slate-800 col-span-2 shadow-md dark:shadow-none bg-white dark:bg-slate-900 lg:col-span-1">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg font-medium leading-6 text-slate-900 dark:text-slate-500">
                {formatMessage({ id: 'input', defaultMessage: 'Input' })}
              </h3>
            </div>
            <JSONView
              value={JSON.stringify(work.input, null, 2)}
              disabled
              className="block w-full max-w-full resize-none sm:text-sm"
            />
          </div>
        )}

        {work?.result && (
          <div className="overflow-hidden rounded-lg shadow-md dark:shadow-none border border-slate-300 dark:border-slate-800 col-span-2 bg-white dark:bg-slate-900 lg:col-span-1">
            <div className="px-4 py-5 sm:px-6 flex items-center justify-between">
              <h3 className="text-lg font-medium leading-6 text-slate-900 dark:text-slate-500">
                {formatMessage({ id: 'result', defaultMessage: 'Result' })}
              </h3>
              {work?.type === 'BULK_IMPORT' && work?.result?.created && (
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {formatMessage(
                    {
                      id: 'items_created',
                      defaultMessage: '{count} items created',
                    },
                    { count: work.result.created.length },
                  )}
                </span>
              )}
            </div>
            <JSONView
              value={JSON.stringify(work.result, null, 2)}
              disabled
              className={`block w-full max-w-full resize-none sm:text-sm ${
                work?.type === 'BULK_IMPORT' &&
                work?.result?.created?.length > 50
                  ? 'max-h-96 overflow-y-auto'
                  : ''
              }`}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkDetail;
