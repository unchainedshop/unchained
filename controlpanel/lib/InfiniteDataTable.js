import { compose, withState } from 'recompose';
import { graphql } from 'react-apollo';
import React from 'react';
import {
  Table, Icon, Button, Loader,
} from 'semantic-ui-react';
import InfiniteScroll from 'react-infinite-scroller';
import Link from 'next/link';

export default ({
  items, cols = 4, rowRenderer, createPath, data,
  children, loadMoreEntries, hasMore, ...rest
}) => (
  <Table celled {...rest}>
    <Table.Header>
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
                <Icon name="plus" />
                  Add
              </Button>
            </Link>
          )}
        </Table.HeaderCell>
      </Table.Row>
    </Table.Header>
    {items && (
      <InfiniteScroll
        pageStart={0}
        element={'tbody'}
        loadMore={loadMoreEntries}
        hasMore={hasMore}
        loader={(
          <Table.Row>
            <Table.Cell colSpan={cols}>
              <Loader active inline="centered" />
            </Table.Cell>
          </Table.Row>
        )}
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
                <Icon name="plus" />
                {' '}
Hinzufügen
              </Button>
            </Link>
          )}
        </Table.HeaderCell>
      </Table.Row>
    </Table.Footer>
  </Table>
);

Array.prototype.diff = function(a) {return this.filter(i => a.indexOf(i) !== -1)}; // eslint-disable-line

export const withDataTableLoader = ({
  query, queryName, queryOptions, itemsPerPage = 5,
}) => compose(
  withState('hasMore', 'updateHasMore', true),
  graphql(query, {
    options: ({ hasMore, updateHasMore, ...props }) => ({
      variables: {
        offset: 0,
        limit: process.browser ? itemsPerPage : 1,
        ...props,
      },
      ...queryOptions,
    }),
    props: ({
      data: { loading, fetchMore, ...data },
      ownProps: { updateHasMore, hasMore },
    }) => ({
      loading,
      hasMore: (data[queryName] && itemsPerPage > data[queryName].length) ? false : hasMore,
      items: data[queryName],
      loadMoreEntries: () => fetchMore({
        variables: {
          offset: Math.floor(data[queryName].length / itemsPerPage) * itemsPerPage,
          limit: itemsPerPage,
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult || fetchMoreResult[queryName].length === 0) {
            updateHasMore(false);
            return previousResult;
          }

          const oldIds = previousResult[queryName].map(item => item._id);
          const newIds = fetchMoreResult[queryName].filter(item => oldIds.indexOf(item._id) === -1);
          if (newIds.length === 0) {
            updateHasMore(false);
            return previousResult;
          }

          const newObj = { };
          newObj[queryName] = [...previousResult[queryName], ...newIds];
          return Object.assign({}, previousResult, newObj);
        },
      }),
    }),
  }),
);
