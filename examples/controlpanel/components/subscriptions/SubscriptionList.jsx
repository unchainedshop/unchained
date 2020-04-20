import { format } from 'date-fns';
import gql from 'graphql-tag';
import React from 'react';
import { Table } from 'semantic-ui-react';
import Link from 'next/link';
import InfiniteDataTable, { withDataTableLoader } from '../InfiniteDataTable';

const SubscriptionList = ({
  isShowCarts,
  toggleShowCarts,
  loading,
  updateHasMore,
  setShowCarts,
  ...rest
}) => (
  <InfiniteDataTable
    {...rest}
    cols={5}
    createPath={null}
    rowRenderer={(subscription) => (
      <Table.Row key={subscription._id}>
        <Table.Cell>
          <Link href={`/subscriptions/view?_id=${subscription._id}`}>
            <a href={`/subscriptions/view?_id=${subscription._id}`}>
              {subscription.subscriptionNumber ? (
                <>
                  <b>{subscription.subscriptionNumber}</b>
                  <small>
                    &nbsp;(
                    {subscription._id})
                  </small>
                </>
              ) : (
                <>
                  <b>Subscription</b>
                  <small>
                    &nbsp;(
                    {subscription._id})
                  </small>
                </>
              )}
            </a>
          </Link>
        </Table.Cell>
        <Table.Cell>
          {subscription.user &&
            (subscription.user.name || subscription.user._id)}
        </Table.Cell>
        <Table.Cell>
          {subscription.expires &&
            new Date(subscription.expires).toLocaleDateString()}
        </Table.Cell>
        <Table.Cell>{subscription.status}</Table.Cell>
      </Table.Row>
    )}
  >
    <Table.Row>
      <Table.HeaderCell>Subscription #</Table.HeaderCell>
      <Table.HeaderCell>User</Table.HeaderCell>
      <Table.HeaderCell>Expires</Table.HeaderCell>
      <Table.HeaderCell>Status</Table.HeaderCell>
    </Table.Row>
  </InfiniteDataTable>
);

export default withDataTableLoader({
  queryName: 'subscriptions',
  query: gql`
    query subscriptions($offset: Int, $limit: Int) {
      subscriptions(offset: $offset, limit: $limit) {
        _id
        status
        expires
        subscriptionNumber
        user {
          _id
          name
        }
        status
      }
    }
  `,
})(SubscriptionList);
