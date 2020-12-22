import gql from 'graphql-tag';
import React, { useEffect, useState } from 'react';
import { Table } from 'semantic-ui-react';
import Link from 'next/link';
import InfiniteDataTable, { withDataTableLoader } from '../InfiniteDataTable';

const relativeScheduleFromWork = ({ scheduledTime, relativeTime, status }) => {
  if (status === 'FAILED' || status === 'SUCCESS' || status === 'DELETED')
    return null;
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
    (scheduledTime <= relativeTime && work.status === 'NEW') ||
    work.status === 'ALLOCATED';
  return (
    <Table.Row
      key={work._id}
      warning={isReady}
      error={work.status === 'FAILED'}
      positive={work.status === 'SUCCESS'}
    >
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
      <Table.Cell>
        {work.started && new Date(work.started).toLocaleString()}
      </Table.Cell>
      <Table.Cell>
        {work.finished && new Date(work.finished).toLocaleString()}
      </Table.Cell>
    </Table.Row>
  );
};

const WorkList = ({ loading, updateHasMore, queryOptions, ...rest }) => {
  const [relativeDate, setDate] = useState(new Date());
  useEffect(() => {
    if (!queryOptions) return () => {};
    const refreshDates = setInterval(() => {
      setDate(new Date());
    }, 1000);
    return () => {
      clearInterval(refreshDates);
    };
  }, []); // Add dependencies here

  return (
    <InfiniteDataTable
      {...rest}
      cols={6}
      createPath={null}
      rowRenderer={(work) => (
        <WorkRow key={work._id} work={work} relativeDate={relativeDate} />
      )}
    >
      <Table.Row>
        <Table.HeaderCell>Work #</Table.HeaderCell>
        <Table.HeaderCell>Status</Table.HeaderCell>
        <Table.HeaderCell>Created</Table.HeaderCell>
        <Table.HeaderCell>Scheduled</Table.HeaderCell>
        <Table.HeaderCell>Started</Table.HeaderCell>
        <Table.HeaderCell>Finished</Table.HeaderCell>
      </Table.Row>
    </InfiniteDataTable>
  );
};

export default withDataTableLoader({
  itemsPerPage: 50,
  queryName: 'workQueue',
  query: gql`
    query workQueue($offset: Int, $limit: Int, $status: [WorkStatus!]!, $type: [String] = []) {
      workQueue(offset: $offset, limit: $limit, status: $status, type: $type) {
        _id
        type
        scheduled
        status
        started
        finished
        created
      }
    }
  `,
})(WorkList);
