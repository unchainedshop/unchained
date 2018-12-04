import {
  compose, mapProps, pure, withHandlers,
} from 'recompose';
import gql from 'graphql-tag';
import { format } from 'date-fns';
import { graphql } from 'react-apollo';
import React from 'react';
import {
  Segment, List, Label, Icon, Button,
} from 'semantic-ui-react';
import Link from 'next/link';

const colorForStatus = (status) => {
  if (status === 'PAID') return 'green';
  return 'red';
};

const OrderPayment = ({
  provider = { interface: {} }, status, statusColor, payOrder, paid, orderStatus,
}) => (
  <Segment secondary>
    <Label color={statusColor} horizontal attached="top">
      {status}
      <Label.Detail>
Payment Provider
      </Label.Detail>
    </Label>
    <List relaxed divided>
      <List.Item>
        <Label horizontal basic>
          <Icon name="ship" />
          <Link href={`/payment-providers/edit?_id=${provider._id}`}>
            <a href={`/payment-providers/edit?_id=${provider._id}`}>
              {provider.interface.label}
              {' '}
              {provider.interface.version}
              {' '}
(
              {provider.type}
)
            </a>
          </Link>
        </Label>
        <p>
          Date of Payment with Provider:
          {' '}
          {paid
            ? format(paid, 'Pp')
            : 'n/a'}
        </p>
      </List.Item>
    </List>
    {status === 'OPEN' && orderStatus !== 'OPEN' && (
      <Button
        primary
        fluid
        onClick={payOrder}
      >
        Mark Order as PAID manually
      </Button>
    )}
  </Segment>
);

export default compose(
  graphql(gql`
    mutation payOrder($orderId: ID!) {
      payOrder(orderId: $orderId) {
        _id
        status
        delivery {
          _id
          status
        }
        payment {
          _id
          status
        }
      }
    }
  `, {
    name: 'payOrder',
    options: {
      refetchQueries: [
        'orders',
        'order',
      ],
    },
  }),
  graphql(gql`
    query order($orderId: ID!) {
      order(orderId: $orderId) {
        _id
        status
        payment {
          _id
          __typename
          paid
          provider {
            _id
            type
            interface {
              _id
              label
              version
            }
          }
          status
          fee {
            amount
            currency
          }
        }
      }
    }
  `),
  withHandlers({
    payOrder: ({ payOrder, orderId }) => () => payOrder({
      variables: {
        orderId,
      },
    }),
  }),
  mapProps(({
    payOrder,
    data: { order = {} },
  }) => ({
    payOrder,
    statusColor: colorForStatus(order.payment && order.payment.status),
    orderStatus: order.status,
    ...order.payment,
  })),
  pure,
)(OrderPayment);
