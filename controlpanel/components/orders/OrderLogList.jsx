import {
  compose, mapProps, pure, defaultProps,
} from 'recompose';
import Moment from 'react-moment';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import React from 'react';
import {
  Table, Label, Icon, Segment,
} from 'semantic-ui-react';
import Link from 'next/link';

const OrderLogList = ({ logs }) => (
  <Segment secondary>
    <Label horizontal attached="top">
      <Label.Detail>
Logs
      </Label.Detail>
    </Label>
    <Table compact>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>
Date
          </Table.HeaderCell>
          <Table.HeaderCell>
Message
          </Table.HeaderCell>
          <Table.HeaderCell>
Context
          </Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      {logs && (
        <Table.Body>
          {logs.map(({
            _id, level, message, created, user,
          }) => (
            <Table.Row key={_id}>
              <Table.Cell singleLine>
                <Moment format="DD.MM HH:mm:ss">
                  {created}
                </Moment>
              </Table.Cell>
              <Table.Cell warning={level === 'warn'} error={level === 'error'}>
                <code>
                  {message}
                </code>
              </Table.Cell>
              <Table.Cell>
                {user && (
                <Link href={`/users/edit?_id=${user._id}`} passHref>
                  <Label horizontal basic>
                    <Icon name="user" />
                    {' '}
                    {user.name.substr(0, 4)}
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

  </Segment>
);

export default compose(
  defaultProps({ limit: 50, offset: 0 }),
  graphql(gql`
    query orderLogs($orderId: ID!, $offset: Int, $limit: Int) {
      order(orderId: $orderId) {
        _id
        logs(offset: $offset, limit: $limit) {
          _id
          created
          level
          message
          user {
            _id
            name
          }
        }
      }
    }
  `),
  mapProps(({ data: { order = {} } }) => ({
    logs: order.logs,
  })),
  pure,
)(OrderLogList);
