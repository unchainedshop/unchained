import gql from 'graphql-tag';
import React from 'react';
import { Table } from 'semantic-ui-react';
import Link from 'next/link';
import InfiniteDataTable, { withDataTableLoader } from '../InfiniteDataTable';

const WorkList = ({ loading, updateHasMore, ...rest }) => (
  <InfiniteDataTable
    {...rest}
    cols={6}
    createPath={null}
    rowRenderer={(work) => (
      <Table.Row key={work._id}>
        <Table.Cell>
          <Link href={`/work/view?_id=${work._id}`}>
            <a href={`/work/view?_id=${work._id}`}>{work.type}</a>
          </Link>
        </Table.Cell>
        <Table.Cell>{work.status}</Table.Cell>
        <Table.Cell>{new Date(work.created).toLocaleString()}</Table.Cell>
        <Table.Cell>
          {work.scheduled && new Date(work.scheduled).toLocaleString()}
        </Table.Cell>
        <Table.Cell>
          {work.started && new Date(work.started).toLocaleString()}
        </Table.Cell>
        <Table.Cell>
          {work.stopped && new Date(work.stopped).toLocaleString()}
        </Table.Cell>
      </Table.Row>
    )}
  >
    <Table.Row>
      <Table.HeaderCell>Work #</Table.HeaderCell>
      <Table.HeaderCell>Status</Table.HeaderCell>
      <Table.HeaderCell>Created</Table.HeaderCell>
      <Table.HeaderCell>Scheduled</Table.HeaderCell>
      <Table.HeaderCell>Started</Table.HeaderCell>
      <Table.HeaderCell>Stopped</Table.HeaderCell>
    </Table.Row>
  </InfiniteDataTable>
);

export default withDataTableLoader({
  queryName: 'workQueue',
  query: gql`
    query workQueue($offset: Int, $limit: Int) {
      workQueue(
        offset: $offset
        limit: $limit
        status: [ALLOCATED, NEW, SUCCESS, FAILED]
      ) {
        _id
        type
        scheduled
        status
        started
        stopped
        created
      }
    }
  `,
})(WorkList);
