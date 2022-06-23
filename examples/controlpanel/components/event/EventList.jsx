import gql from 'graphql-tag';
import React from 'react';
import { Table } from 'semantic-ui-react';
import Link from 'next/link';
import { compose, defaultProps } from 'recompose';

import InfiniteDataTable, { withDataTableLoader } from '../InfiniteDataTable';

const EventRow = ({ type, created, _id }) => {
  return (
    <Table.Row>
      <Table.Cell>
        <Link href={`/events/view?_id=${_id}`}>
          <a href={`/events/view?_id=${_id}`}>{type}</a>
        </Link>
      </Table.Cell>
      <Table.Cell>{new Date(created).toLocaleString()}</Table.Cell>
    </Table.Row>
  );
};

const EventList = ({ onFilterChange, types, loading, updateHasMore, queryOptions, ...rest }) => {
  return (
    <InfiniteDataTable
      {...rest}
      cols={6}
      createPath={null}
      rowRenderer={({ _id, type, created }) => (
        <EventRow key={_id} type={type} created={created} _id={_id} />
      )}
    >
      <Table.Row>
        <Table.HeaderCell>Created</Table.HeaderCell>
        <Table.HeaderCell>Type</Table.HeaderCell>
      </Table.Row>
    </InfiniteDataTable>
  );
};

export default compose(
  defaultProps({ limit: 20, offset: 0 }),
  withDataTableLoader({
    queryName: 'events',
    query: gql`
      query Events($offset: Int, $limit: Int, $type: String) {
        events(offset: $offset, limit: $limit, type: $type) {
          _id
          type
          created
        }
      }
    `,
  }),
)(EventList);
