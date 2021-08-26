import { compose } from 'recompose';
import { graphql } from '@apollo/client/react/hoc';
import React, { useEffect, useState } from 'react';
import { Table, Icon, Button } from 'semantic-ui-react';
import { InView } from 'react-intersection-observer';
import Link from 'next/link';

const InfiniteDataTable = ({
  items,
  cols = 4,
  rowRenderer,
  createPath,
  searchComponent,
  children,
  loadMoreEntries,
  loading,
  limit,
  itemsCount,
  ...rest
}) => {
  const [hasMore, setHasMore] = useState(true);
  useEffect(() => {
    // Reset the fake load more
    setHasMore(itemsCount >= limit);
  }, [itemsCount]);

  const onLoad = () => {
    setHasMore(false);
    loadMoreEntries();
  };

  return (
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
      <Table.Body>
        {items?.map(rowRenderer)}
        <Table.Row>
          <Table.Cell colSpan={cols}>
            <InView
              as="div"
              onChange={(inView) => {
                if (inView && hasMore && !loading) {
                  onLoad();
                }
              }}
            >
              {hasMore && (
                <Button
                  floated="right"
                  icon
                  loading={loading}
                  disabled={loading}
                  primary
                  size="medium"
                  onClick={onLoad}
                >
                  <Icon name="ellipsis vertical" />
                  Load more
                </Button>
              )}
            </InView>
          </Table.Cell>
        </Table.Row>
      </Table.Body>
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
};

export const withDataTableLoader = ({ query, queryName }) =>
  compose(
    graphql(query, {
      options: ({ queryOptions = {}, limit, ...props }) => ({
        variables: {
          offset: 0,
          limit,
          ...props,
        },
        ...queryOptions,
      }),
      props: ({ data: { loading, fetchMore, ...data } }) => {
        return {
          loading,
          itemsCount: data[queryName]?.length || 0,
          items: data[queryName],
          loadMoreEntries: () => {
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
        };
      },
    })
  );

export default InfiniteDataTable;
