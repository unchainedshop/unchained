import {
  ExclamationTriangleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import useWorkQueue from '../hooks/useWorkQueue';
import { IWorkStatus } from '../../../gql/types';
import Link from 'next/link';
import { useIntl } from 'react-intl';
import useLocalStorage from '../../common/hooks/useLocalStorage';

export const WorkQueueWarningBanner = () => {
  const { formatMessage } = useIntl();
  const [isDismissed, setIsDismissed] = useLocalStorage(
    'workQueueWarningBanner:dismissed',
    false,
  );
  const { workQueue } = useWorkQueue({
    status: [IWorkStatus.Failed],
    pollInterval: 0,
  });
  const normalizedQueue = workQueue.reduce((prev, work) => {
    if (prev[work?.type]) {
      prev[work?.type] = {
        ...prev[work?.type],
        count: prev[work?.type].count + 1,
      };
    } else {
      prev[work?.type] = {
        ...work,
        count: 1,
      };
    }
    return prev;
  }, {});

  const summary = Object.entries(normalizedQueue)
    .map(([type, { count }]: any) => `${count} ${type}`)
    .join(', ');

  if (isDismissed || !workQueue.length) return null;

  return (
    <div className="p-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-lg mb-6">
      <div className="flex items-center gap-4">
        <ExclamationTriangleIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
        <div className="flex-1 text-sm text-amber-800 dark:text-amber-200">
          <strong>
            {formatMessage({
              id: 'work_queue_problem_detected',
              defaultMessage: 'Problems detected in the Work Queue',
            })}
          </strong>{' '}
          {summary}
        </div>
        <Link
          href={'/works/?status=FAILED'}
          className="ml-4 text-amber-700 dark:text-amber-300 hover:underline text-sm font-medium"
        >
          {formatMessage({
            id: 'check_work_queue_details',
            defaultMessage: 'Check Work Queue for Details',
          })}
        </Link>
        <button
          onClick={() => setIsDismissed(true)}
          className="flex-shrink-0 p-1 text-amber-600 dark:text-amber-600 hover:text-amber-800 dark:hover:text-amber-200"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
