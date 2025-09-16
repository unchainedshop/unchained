import { useIntl } from 'react-intl';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Badge from '../../common/components/Badge';
import Table from '../../common/components/Table';

import { WORK_STATUSES } from '../../common/data/miscellaneous';
import useFormatDateTime from '../../common/utils/useFormatDateTime';
import useFormatWorkDurations from '../hooks/useFormatWorkDurations';
import Tooltip from '../../common/components/ToolTip';
import RetryStatistics from './RetryStatistics';

const WorkListItem = ({ work }) => {
  const { formatMessage } = useIntl();

  const { formatDateTime } = useFormatDateTime();
  const { getScheduledTime, getDuration } = useFormatWorkDurations();

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
    dateStyle: 'short',
    timeStyle: 'short',
  };
  return (
    <Table.Row>
      <Table.Cell>
        <div className="flex items-center text-sm">
          <Link
            href={`/works?workerId=${work._id}`}
            className="text-slate-900 dark:text-slate-300"
          >
            <RetryStatistics work={work}>
              {work?.type || (
                <>
                  {work._id}{' '}
                  <Badge
                    color="blue"
                    text={formatMessage({ id: 'type', defaultMessage: 'Type' })}
                  />
                </>
              )}
            </RetryStatistics>
          </Link>
        </div>
      </Table.Cell>

      <Table.Cell>
        <Badge text={work?.status} color={WORK_STATUSES[work.status]} square />
      </Table.Cell>

      <Table.Cell>
        <div className="flex items-center text-sm">
          {work.created ? formatDateTime(work.created, options) : 'n/a'}
        </div>
      </Table.Cell>

      <Table.Cell>
        <div className="flex items-center text-sm">
          <Tooltip text={formatDateTime(work?.scheduled, options)}>
            {getScheduledTime(work)}
          </Tooltip>
        </div>
      </Table.Cell>

      <Table.Cell>
        <div className="flex items-center text-sm">
          {work.started ? formatDateTime(work.started, options) : 'n/a'}
        </div>
      </Table.Cell>

      <Table.Cell>
        <div className="flex items-center text-sm">
          {work.finished ? formatDateTime(work.finished, options) : 'n/a'}
        </div>
      </Table.Cell>
      <Table.Cell>
        <div className="flex items-center text-sm">{getDuration(work)}</div>
      </Table.Cell>
    </Table.Row>
  );
};

export default WorkListItem;
