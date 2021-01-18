import { compose } from 'recompose';
import { graphql } from '@apollo/client/react/hoc';
import React from 'react';
import { Table, Icon, Button } from 'semantic-ui-react';
import InfiniteScroll from 'react-infinite-scroller';
import Link from 'next/link';
var hasMore = true;
var previousResult = [];
const InfiniteDataTable = ({
  items,
  cols = 4,
  rowRenderer,
  createPath,
  searchComponent,
  data,
  children,
  loadMoreEntries,
  loading,
  limit,
  ...rest
}) => (
  <Table celled {...rest}>
    <Table.Header>
      <Table.Row>
        <Table.HeaderCell colSpan={cols}>
          {searchComponent && searchComponent}
          {createPath && (
            <Link href={createPath}>
              <Button
                floated="right"
                icon
                labelPosition="left"
                primary
                size="small"
                href={createPath}
              >
                <Icon name="plus" />
                Add
              </Button>
            </Link>
          )}
        </Table.HeaderCell>
      </Table.Row>
      {children}
    </Table.Header>
    {items && (
      <InfiniteScroll
        pageStart={0}
        hasMore={hasMore}        
        element={'tbody'}
        loadMore={loadMoreEntries}
      >
        {items.map(rowRenderer)}
      </InfiniteScroll>
    )}
    <Table.Footer fullWidth>
      <Table.Row>
        <Table.HeaderCell colSpan={cols}>
          {createPath && (
            <Link href={createPath}>
              <Button
                floated="right"
                icon
                labelPosition="left"
                primary
                size="small"
                href={createPath}
              >
                <Icon name="plus" /> Add
              </Button>
            </Link>
          )}
        </Table.HeaderCell>
      </Table.Row>
    </Table.Footer>
  </Table>
);

export const withDataTableLoader = ({ query, queryName, itemsPerPage = 5 }) =>
  compose(
    graphql(query, {
      options: ({ queryOptions, ...props }) => ({
        variables: {
          offset: 0,
          limit: process.browser ? itemsPerPage : 1,
          ...props,
        },
        ...queryOptions,
      }),
      props: ({ data: { loading, fetchMore, stopPolling, ...data } }) => {
        
              hasMore = previousResult?.length !== data?.[queryName]?.length
        return ({
        loading,
        items: data[queryName],
        loadMoreEntries: () => {
          if(queryName !== 'workQueue') stopPolling();
          return fetchMore({
            variables: {
              offset: data[queryName]?.length,
            },
            updateQuery: (prev, { fetchMoreResult }) => {
              hasMore = previousResult?.length !== prev?.[queryName]?.length
              previousResult = prev?.[queryName];
              if (!fetchMoreResult) return prev;
              return {
                ...prev,
                [queryName]: [
                  ...prev[queryName],
                  ...fetchMoreResult[queryName],
                ],
              };
            },
          });
        },
      })},
    })
  );

export default InfiniteDataTable;
