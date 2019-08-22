import { compose, pure, withState } from 'recompose';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import React from 'react';
import { Table, Icon, Button, Loader } from 'semantic-ui-react';
import InfiniteScroll from 'react-infinite-scroller';
import Link from 'next/link';

const FilterList = ({ filters, loadMoreEntries, hasMore }) => (
  <Table celled>
    <Table.Header>
      <Table.Row>
        <Table.HeaderCell colSpan="4">
          <Link href="/filters/new">
            <Button
              floated="right"
              icon
              labelPosition="left"
              primary
              size="small"
              href="/filters/new"
            >
              <Icon name="plus" />
              Add
            </Button>
          </Link>
        </Table.HeaderCell>
      </Table.Row>
      <Table.Row>
        <Table.HeaderCell>Key (Name)</Table.HeaderCell>
        <Table.HeaderCell>Type</Table.HeaderCell>
        <Table.HeaderCell>Active?</Table.HeaderCell>
        <Table.HeaderCell>Options</Table.HeaderCell>
      </Table.Row>
    </Table.Header>
    {filters && (
      <InfiniteScroll
        element={'tbody'}
        loadMore={loadMoreEntries}
        hasMore={hasMore}
        loader={
          <Table.Row key="filter-loader">
            <Table.Cell colSpan="4">
              <Loader active inline="centered" />
            </Table.Cell>
          </Table.Row>
        }
      >
        {filters.map(filter => (
          <Table.Row key={filter._id}>
            <Table.Cell>
              <Link href={`/filters/edit?_id=${filter._id}`}>
                <a href={`/filters/edit?_id=${filter._id}`}>
                  {filter.key}
                  &nbsp;
                  {filter.texts ? `( ${filter.texts.title} )` : ''}
                </a>
              </Link>
            </Table.Cell>
            <Table.Cell>{filter.type}</Table.Cell>
            <Table.Cell>
              {filter.isActive && (
                <Icon color="green" name="checkmark" size="large" />
              )}
            </Table.Cell>
            <Table.Cell>{filter.options && filter.options.length}</Table.Cell>
          </Table.Row>
        ))}
      </InfiniteScroll>
    )}
    <Table.Footer fullWidth>
      <Table.Row>
        <Table.HeaderCell colSpan="4">
          <Link href="/filters/new">
            <Button
              floated="right"
              icon
              labelPosition="left"
              primary
              size="small"
              href="/filters/new"
            >
              <Icon name="plus" />
              Add
            </Button>
          </Link>
        </Table.HeaderCell>
      </Table.Row>
    </Table.Footer>
  </Table>
);

const ITEMS_PER_PAGE = 10;
export const FILTER_LIST_QUERY = gql`
  query filters($offset: Int, $limit: Int) {
    filters(offset: $offset, limit: $limit, includeInactive: true) {
      _id
      isActive
      key
      type
      texts {
        _id
        title
      }
      options {
        _id
        value
      }
    }
  }
`;

export default compose(
  withState('hasMore', 'updateHasMore', true),
  graphql(FILTER_LIST_QUERY, {
    options: () => ({
      variables: {
        offset: 0,
        limit: ITEMS_PER_PAGE
      }
    }),
    props: ({
      data: { loading, filters, fetchMore },
      ownProps: { updateHasMore }
    }) => ({
      loading,
      filters,
      loadMoreEntries: () =>
        fetchMore({
          variables: {
            offset: filters.length,
            limit: ITEMS_PER_PAGE
          },
          updateQuery: (previousResult, { fetchMoreResult }) => {
            if (!fetchMoreResult || fetchMoreResult.filters.length === 0) {
              updateHasMore(false);
              return previousResult;
            }
            const idComparator = fetchMoreResult.filters[0]._id;
            const alreadyAdded = previousResult.filters.reduce(
              (oldValue, item) => (item._id === idComparator ? true : oldValue),
              false
            );
            if (alreadyAdded) {
              updateHasMore(false);
              return previousResult;
            }
            return {
              ...previousResult,
              filters: [...previousResult.filters, ...fetchMoreResult.filters]
            };
          }
        })
    })
  }),
  pure
)(FilterList);
