import { compose, mapProps, pure } from 'recompose';
import { format } from 'date-fns';
import gql from 'graphql-tag';
import { graphql } from '@apollo/client/react/hoc';
import React from 'react';
import { Table } from 'semantic-ui-react';
import Link from 'next/link';
import FormattedMoney from '../FormattedMoney';

const UserOrderList = ({ orders }) => (
  <Table celled>
    <Table.Header>
      <Table.Row>
        <Table.HeaderCell>Order date</Table.HeaderCell>
        <Table.HeaderCell>Order number</Table.HeaderCell>
        <Table.HeaderCell>Total</Table.HeaderCell>
        <Table.HeaderCell>Status</Table.HeaderCell>
      </Table.Row>
    </Table.Header>
    {orders && (
      <Table.Body>
        {orders.map((order) => (
          <Table.Row key={order._id}>
            <Table.Cell>
              <Link href={`/orders/view?_id=${order._id}`}>
                <a href={`/orders/view?_id=${order._id}`}>
                  {order.ordered
                    ? format(new Date(order.ordered), 'Pp')
                    : 'n/a'}
                </a>
              </Link>
            </Table.Cell>
            <Table.Cell>{order.orderNumber || 'Cart'}</Table.Cell>
            <Table.Cell>
              <FormattedMoney money={order.total} />
            </Table.Cell>
            <Table.Cell>{order.status}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    )}
  </Table>
);

export default compose(
  graphql(gql`
    query userOrders($userId: ID!) {
      user(userId: $userId) {
        _id
        orders {
          _id
          ordered
          orderNumber
          status
          total {
            amount
            currency
          }
        }
      }
    }
  `),
  mapProps(({ data: { user = {} } }) => ({
    orders: user.orders,
  })),
  pure
)(UserOrderList);
