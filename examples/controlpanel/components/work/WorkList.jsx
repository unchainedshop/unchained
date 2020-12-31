import gql from 'graphql-tag';
import React, { useEffect, useState } from 'react';
import { Checkbox, Table } from 'semantic-ui-react';
import Link from 'next/link';
import InfiniteDataTable, { withDataTableLoader } from '../InfiniteDataTable';
import { SEARCH_WORK_TYPES } from '../searchQueries';
import SearchDropdown from '../SearchDropdown';

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
      key={`${work._id}${new Date().getTime()}`}
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

const WorkList = ({
  onFilterChange,
  statusTypes,
  loading,
  updateHasMore,
  queryOptions,
  ...rest
}) => {
  const [selectedTypeFilter, setSelectedTypeFilter] = useState([]);
  const [activeStatus, setActiveStatus] = useState(statusTypes);
  const [relativeDate, setDate] = useState(new Date());
  useEffect(() => {
    const refreshDates = setInterval(() => {
      setDate(new Date());
    }, 1000);

    return () => {
      clearInterval(refreshDates);
    };
  }, [activeStatus, selectedTypeFilter]); // Add dependencies here

  if (!activeStatus.length) {
    setActiveStatus(statusTypes);
  }

  const onWorkStatusChange = (e, { label, checked }) => {
    const currentStatus = activeStatus;
    if (checked) {
      currentStatus.push(label);
    } else {
      currentStatus.splice(currentStatus.indexOf(label), 1);
    }

    setActiveStatus(currentStatus);
    onFilterChange({ filterType: 'status', value: activeStatus });
  };

  return (
    <InfiniteDataTable
      {...rest}
      cols={6}
      limit={5}
      createPath={null}
      rowRenderer={(work) => (
        <WorkRow key={`${work._id}`} work={work} relativeDate={relativeDate} />
      )}
    >
      <Table.Row>
        <Table.HeaderCell colSpan="2">
          <SearchDropdown
            placeholder="Select work type"
            searchQuery={SEARCH_WORK_TYPES}
            multiple
            onChange={(e, { value }) => {
              setSelectedTypeFilter(value);
              onFilterChange({ filterType: 'workType', value });
            }}
            value={selectedTypeFilter}
            queryType={'workTypes'}
          />
        </Table.HeaderCell>
        {statusTypes.map((status) => (
          <Table.HeaderCell key={status}>
            <Checkbox
              label={status}
              checked={activeStatus.indexOf(status) !== -1}
              onChange={onWorkStatusChange}
            />
          </Table.HeaderCell>
        ))}
      </Table.Row>

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
    query workQueue(
      $offset: Int
      $limit: Int
      $status: [WorkStatus!]!
      $selectTypes: [String] = []
    ) {
      workQueue(
        offset: $offset
        limit: $limit
        status: $status
        selectTypes: $selectTypes
      ) {
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
