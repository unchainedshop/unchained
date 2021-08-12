import gql from 'graphql-tag';
import { graphql } from '@apollo/client/react/hoc';
import React from 'react';
import { Table, Label, Icon, Segment } from 'semantic-ui-react';
import Link from 'next/link';

const EnrollmentOrders = ({ data }) => {
  const periods = data?.enrollment?.periods || [];
  return (
    <Segment secondary>
      <Label horizontal attached="top">
        <Label.Detail>Orders / Periods</Label.Detail>
      </Label>
      <Table compact>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Period</Table.HeaderCell>
            <Table.HeaderCell>Is Trial Period</Table.HeaderCell>
            <Table.HeaderCell>Order</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        {periods && (
          <Table.Body>
            {periods.map(({ start, end, isTrial, order }) => (
              <Table.Row key={start}>
                <Table.Cell singleLine>
                  {new Date(start).toLocaleString()} -{' '}
                  {new Date(end).toLocaleString()}
                </Table.Cell>
                <Table.Cell>
                  <code>{isTrial}</code>
                </Table.Cell>
                <Table.Cell>
                  {order && (
                    <Link href={`/orders/view?_id=${order._id}`} passHref>
                      <Label horizontal basic>
                        <Icon name="order" /> {order._id} ({order.status})
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
};

export default graphql(gql`
  query enrollmentOrders($enrollmentId: ID!) {
    enrollment(enrollmentId: $enrollmentId) {
      _id
      periods {
        start
        end
        isTrial
        order {
          _id
          status
        }
      }
    }
  }
`)(EnrollmentOrders);
