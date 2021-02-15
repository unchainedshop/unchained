import { compose, mapProps, pure, defaultProps } from 'recompose';
import { format } from 'date-fns';
import gql from 'graphql-tag';
import { graphql } from '@apollo/client/react/hoc';
import React from 'react';
import { Table, Label, Icon } from 'semantic-ui-react';
import Link from 'next/link';

const UserLogList = ({ logs }) => (
  <Table compact>
    <Table.Header>
      <Table.Row>
        <Table.HeaderCell>Date</Table.HeaderCell>
        <Table.HeaderCell>Message</Table.HeaderCell>
        <Table.HeaderCell>Context</Table.HeaderCell>
      </Table.Row>
    </Table.Header>
    {logs && (
      <Table.Body>
        {logs.map(({ _id, level, message, created, order }) => (
          <Table.Row key={_id}>
            <Table.Cell singleLine>{format(created, 'Pp')}</Table.Cell>
            <Table.Cell warning={level === 'warn'} error={level === 'error'}>
              <code>{message}</code>
            </Table.Cell>
            <Table.Cell>
              {order && (
                <Link href={`/orders/view?_id=${order._id}`} passHref>
                  <Label horizontal basic>
                    <Icon name="cart" />{' '}
                    {(order.orderNumber || order._id).substr(0, 4)}
                    ...
                  </Label>
                </Link>
              )}
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    )}
  </Table>
);

export default compose(
  defaultProps({ limit: 20, offset: 0 }),
  graphql(gql`
    query userLogs($userId: ID!, $offset: Int, $limit: Int) {
      user(userId: $userId) {
        _id
        logs(offset: $offset, limit: $limit) {
          _id
          created
          level
          message
          order {
            _id
            orderNumber
          }
        }
      }
    }
  `),
  mapProps(({ data: { user = {} } }) => ({
    logs: user.logs,
  })),
  pure
)(UserLogList);
