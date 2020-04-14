import { compose, withHandlers, withState } from 'recompose';
import { format } from 'date-fns';
import gql from 'graphql-tag';
import React from 'react';
import { Table } from 'semantic-ui-react';
import Link from 'next/link';
import InfiniteDataTable, { withDataTableLoader } from '../InfiniteDataTable';
import FormattedMoney from '../FormattedMoney';

const OrderList = ({
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
    rowRenderer={(order) => (
      <Table.Row key={order._id}>
        <Table.Cell>
          {order.ordered ? format(order.ordered, 'Pp') : 'n/a'}
        </Table.Cell>
        <Table.Cell>
          <Link href={`/orders/view?_id=${order._id}`}>
            <a href={`/orders/view?_id=${order._id}`}>
              {order.orderNumber ? (
                <>
                  <b>{order.orderNumber}</b>
                  <small>
                    &nbsp;(
                    {order._id})
                  </small>
                </>
              ) : (
                <>
                  <b>Cart</b>
                  <small>
                    &nbsp;(
                    {order._id})
                  </small>
                </>
              )}
            </a>
          </Link>
        </Table.Cell>
        <Table.Cell>
          {order.user && (order.user.name || order.user._id)}
        </Table.Cell>
        <Table.Cell>
          <FormattedMoney money={order.total} />
        </Table.Cell>
        <Table.Cell>{order.status}</Table.Cell>
      </Table.Row>
    )}
  >
    <Table.Row>
      <Table.HeaderCell colSpan={5}>
        Show carts? &nbsp;
        <input
          type="checkbox"
          checked={isShowCarts}
          onChange={toggleShowCarts}
        />
      </Table.HeaderCell>
    </Table.Row>
    <Table.Row>
      <Table.HeaderCell>Order date</Table.HeaderCell>
      <Table.HeaderCell>Order #</Table.HeaderCell>
      <Table.HeaderCell>User</Table.HeaderCell>
      <Table.HeaderCell>Total</Table.HeaderCell>
      <Table.HeaderCell>Status</Table.HeaderCell>
    </Table.Row>
  </InfiniteDataTable>
);

export default compose(
  withState('isShowCarts', 'setShowCarts', false),
  withDataTableLoader({
    queryName: 'orders',
    query: gql`
      query orders($offset: Int, $limit: Int, $isShowCarts: Boolean) {
        orders(offset: $offset, limit: $limit, includeCarts: $isShowCarts) {
          _id
          ordered
          orderNumber
          status
          user {
            _id
            name
          }
          total {
            amount
            currency
          }
        }
      }
    `,
  }),
  withHandlers({
    toggleShowCarts: ({ updateHasMore, isShowCarts, setShowCarts }) => () => {
      setShowCarts(!isShowCarts);
      updateHasMore(true);
    },
  })
)(OrderList);
