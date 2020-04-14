import Link from 'next/link';
import { compose, pure, defaultProps } from 'recompose';
import { format } from 'date-fns';
import gql from 'graphql-tag';
import React from 'react';
import { Table, Loader, Label, Icon } from 'semantic-ui-react';
import { graphql } from 'react-apollo';

const defaultLogs = [];

const LogList = ({ data: { logs = defaultLogs, loading }, ...rest }) => (
  <Table celled {...rest}>
    <Table.Header>
      <Table.Row>
        <Table.HeaderCell>Log date</Table.HeaderCell>
        <Table.HeaderCell>Message</Table.HeaderCell>
        <Table.HeaderCell>Context</Table.HeaderCell>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {loading && (
        <Table.Row>
          <Table.Cell colSpan={3}>
            <Loader active inline="centered" />
          </Table.Cell>
        </Table.Row>
      )}
      {logs.map(({ _id, level, message, created, user, order }) => (
        <Table.Row key={_id}>
          <Table.Cell singleLine>
            {created ? format(created, 'Pp') : null}
          </Table.Cell>
          <Table.Cell
            warning={level === 'warn' ? 'warn' : null}
            error={level === 'error'}
          >
            <code>{message}</code>
          </Table.Cell>
          <Table.Cell>
            {user && (
              <Link href={`/users/edit?_id=${user._id}`} passHref>
                <Label horizontal basic>
                  <Icon name="user" /> {user.name.substr(0, 4)}
                  ...
                </Label>
              </Link>
            )}
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
  </Table>
);

export default compose(
  defaultProps({ limit: 50, offset: 0 }),
  graphql(
    gql`
      query logs($offset: Int, $limit: Int) {
        logs(offset: $offset, limit: $limit) {
          _id
          created
          level
          message
          user {
            _id
            name
          }
          order {
            _id
            orderNumber
          }
        }
      }
    `,
    {
      options: { pollInterval: 2000 },
    }
  ),
  pure
)(LogList);
