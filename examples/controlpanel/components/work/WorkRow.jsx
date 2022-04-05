import React from 'react';
import { Table } from 'semantic-ui-react';
import Link from 'next/link';

const relativeScheduleFromWork = ({ scheduledTime, relativeTime, status }) => {
  if (status === 'FAILED' || status === 'SUCCESS' || status === 'DELETED') return null;
  const diff = scheduledTime - relativeTime;
  const seconds = diff / 1000;
  const minutes = seconds / 60;
  if (status === 'ALLOCATED') {
    if (diff <= -3000000) return null;
    if (diff <= -60000) return `Running ${Math.round(minutes * -1)} minutes`;
    if (diff <= -1000) return `Running ${Math.round(seconds * -1)} seconds`;
    return 'Running';
  }
  if (scheduledTime <= relativeTime) return 'Ready';
  if (diff <= 60000) return `Ready in ${Math.round(seconds)} seconds`;
  if (diff <= 3000000) return `Ready in ${Math.round(minutes)} minutes`;
  return null;
};

const WorkRow = ({ work, relativeDate }) => {
  const scheduledDate = work.scheduled && new Date(work.scheduled);
  const scheduledTime = scheduledDate && scheduledDate.getTime();
  const relativeTime = relativeDate && relativeDate.getTime();
  const isReady =
    (scheduledTime <= relativeTime && work.status === 'NEW') || work.status === 'ALLOCATED';
  return (
    <Table.Row warning={isReady} error={work.status === 'FAILED'} positive={work.status === 'SUCCESS'}>
      <Table.Cell>
        <Link href={`/work/view?_id=${work._id}`}>
          <a href={`/work/view?_id=${work._id}`}>{work.type}</a>
        </Link>
      </Table.Cell>
      <Table.Cell>{work.status}</Table.Cell>
      <Table.Cell>{new Date(work.created).toLocaleString()}</Table.Cell>
      <Table.Cell>
        {scheduledDate &&
          (relativeScheduleFromWork({
            scheduledTime,
            relativeTime,
            status: work.status,
          }) ||
            scheduledDate.toLocaleString())}
      </Table.Cell>
      <Table.Cell>{work.started && new Date(work.started).toLocaleString()}</Table.Cell>
      <Table.Cell>{work.finished && new Date(work.finished).toLocaleString()}</Table.Cell>
    </Table.Row>
  );
};

export default WorkRow;
