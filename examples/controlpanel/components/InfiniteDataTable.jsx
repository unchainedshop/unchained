import { compose } from 'recompose';
import { graphql } from '@apollo/client/react/hoc';
import React from 'react';
import { Table, Icon, Button } from 'semantic-ui-react';
import InfiniteScroll from 'react-infinite-scroller';
import Link from 'next/link';
let previousOffset = 0;

const InfiniteDataTable = ({
  items,
  hasMore,
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
}) => {
  console.log(items?.length)
  return(
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
        element={'tbody'}
        loadMore={loadMoreEntries}
        hasMore={true}
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
)};

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
              
        return ({
        loading,
        hasMore : true,
        items: data[queryName],
        loadMoreEntries: () => {
          stopPolling();
          return fetchMore({
            variables: {
              offset: data[queryName]?.length,
            },
            updateQuery: (prev, { fetchMoreResult }) => {
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
