import { compose, withState, withHandlers } from 'recompose';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import React from 'react';
import { Table, Icon, Button, Loader, Label } from 'semantic-ui-react';
import InfiniteScroll from 'react-infinite-scroller';
import Link from 'next/link';

const UserList = ({
  users,
  loadMoreEntries,
  hasMore,
  isShowGuests,
  toggleShowGuests
}) => (
  <Table celled>
    <Table.Header>
      <Table.Row>
        <Table.HeaderCell colSpan={3}>
          Show guests? &nbsp;
          <input
            type="checkbox"
            checked={isShowGuests}
            onChange={toggleShowGuests}
          />
          <Link href="/users/new">
            <Button
              floated="right"
              icon
              labelPosition="left"
              primary
              size="small"
              href="/users/new"
            >
              <Icon name="plus" />
              New User
            </Button>
          </Link>
        </Table.HeaderCell>
      </Table.Row>
      <Table.Row>
        <Table.HeaderCell>E-Mail Address</Table.HeaderCell>
        <Table.HeaderCell>Name</Table.HeaderCell>
        <Table.HeaderCell>User Type</Table.HeaderCell>
      </Table.Row>
    </Table.Header>

    {users && (
      <InfiniteScroll
        pageStart={0}
        element={'tbody'}
        loadMore={loadMoreEntries}
        hasMore={hasMore}
        loader={
          <Table.Row key="user-loader">
            <Table.Cell colSpan="4">
              <Loader active inline="centered" />
            </Table.Cell>
          </Table.Row>
        }
      >
        {users.map(({ name, email, _id, tags, isEmailVerified, isGuest }) => (
          <Table.Row key={_id}>
            <Table.Cell>
              <Link href={`/users/edit?_id=${_id}`}>
                <a href={`/users/edit?_id=${_id}`}>{email}</a>
              </Link>
            </Table.Cell>
            <Table.Cell>
              {name}
              &nbsp;
              {tags &&
                tags.length > 0 &&
                tags.map(tag => (
                  <Label key={tag} color="grey" horizontal>
                    {tag}
                  </Label>
                ))}
            </Table.Cell>
            <Table.Cell>
              {isGuest ? (
                <Label color="orange" horizontal>
                  Guest
                </Label>
              ) : (
                <Label color={isEmailVerified ? 'green' : 'red'} horizontal>
                  {isEmailVerified ? 'Verified' : 'Unverified'}
                </Label>
              )}
            </Table.Cell>
          </Table.Row>
        ))}
      </InfiniteScroll>
    )}
    <Table.Footer fullWidth>
      <Table.Row>
        <Table.HeaderCell colSpan="4">
          <Link href="/users/new">
            <Button
              floated="right"
              icon
              labelPosition="left"
              primary
              size="small"
              href="/users/new"
            >
              <Icon name="plus" />
              New User
            </Button>
          </Link>
        </Table.HeaderCell>
      </Table.Row>
    </Table.Footer>
  </Table>
);

const ITEMS_PER_PAGE = 10;
export const USER_LIST_QUERY = gql`
  query users($offset: Int, $limit: Int, $includeGuests: Boolean) {
    users(offset: $offset, limit: $limit, includeGuests: $includeGuests) {
      _id
      isGuest
      isEmailVerified
      tags
      name
      email
    }
  }
`;

export default compose(
  withState('hasMore', 'updateHasMore', true),
  withState('isShowGuests', 'setShowGuests', false),
  withHandlers({
    toggleShowGuests: ({
      isShowGuests,
      updateHasMore,
      setShowGuests
    }) => () => {
      setShowGuests(!isShowGuests);
      updateHasMore(true);
    }
  }),
  graphql(USER_LIST_QUERY, {
    options: ({ isShowGuests }) => ({
      variables: {
        includeGuests: isShowGuests,
        offset: 0,
        limit: ITEMS_PER_PAGE
      }
    }),
    props: ({
      data: { loading, users, fetchMore },
      ownProps: { updateHasMore, isShowGuests }
    }) => ({
      loading,
      users,
      loadMoreEntries: () =>
        fetchMore({
          variables: {
            includeGuests: isShowGuests,
            offset: Math.floor(users.length / ITEMS_PER_PAGE) * ITEMS_PER_PAGE,
            limit: ITEMS_PER_PAGE
          },
          updateQuery: (previousResult, { fetchMoreResult }) => {
            if (!fetchMoreResult || fetchMoreResult.users.length === 0) {
              updateHasMore(false);
              return previousResult;
            }
            const idComparator = fetchMoreResult.users[0]._id;
            const alreadyAdded = previousResult.users.reduce(
              (oldValue, item) => (item._id === idComparator ? true : oldValue),
              false
            );
            if (alreadyAdded) {
              updateHasMore(false);
              return previousResult;
            }
            return {
              ...previousResult,
              users: [...previousResult.users, ...fetchMoreResult.users]
            };
          }
        })
    })
  })
)(UserList);
