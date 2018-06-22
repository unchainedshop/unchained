import { compose, mapProps, pure } from 'recompose';
import gql from 'graphql-tag';
import Moment from 'react-moment';
import { graphql } from 'react-apollo';
import React from 'react';
import {
  Segment, List, Label, Icon,
} from 'semantic-ui-react';
import Link from 'next/link';
import Address from '../Address';

const colorForStatus = (status) => {
  if (status === 'DELIVERED') return 'green';
  return 'red';
};

const OrderDelivery = ({
  provider = { interface: {} }, status, address, statusColor, delivered,
}) => (
  <Segment secondary>
    <Label color={statusColor} horizontal attached="top">
      {status}
      <Label.Detail>
Delivery Provider
      </Label.Detail>
    </Label>
    <List relaxed divided>
      <List.Item>
        <Label horizontal basic>
          <Icon name="ship" />
          {provider && provider.interface && (
          <Link href={`/delivery-providers/edit?_id=${provider._id}`}>
            <a href={`/delivery-providers/edit?_id=${provider._id}`}>
              {provider.interface.label}
              {' '}
              {provider.interface.version}
              {' '}
(
              {provider.type}
)
            </a>
          </Link>
          )}
        </Label>
        <p>
          Date of Delivery to Provider:
          {' '}
          {delivered ? (
            <Moment format="lll">
              {delivered}
            </Moment>
          ) : 'n/a'}
        </p>
      </List.Item>
      {address && (
        <List.Item>
          <Label horizontal basic>
            <Icon name="mail" />
            Delivery Address
          </Label>
          <Address {...address} />
        </List.Item>
      )}
    </List>
  </Segment>
);

export default compose(
  graphql(gql`
    query order($orderId: ID!) {
      order(orderId: $orderId) {
        _id
        address {
          firstName
          lastName
          company
          postalCode
          countryCode
          regionCode
          city
          addressLine
          addressLine2
        }
        delivery {
          _id
          __typename
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
          delivered
          fee {
            amount
            currency
          }
          ... on OrderDeliveryPickUp {
            address {
              firstName
              lastName
              company
              postalCode
              countryCode
              regionCode
              city
              addressLine
              addressLine2
            }
          }
          ... on OrderDeliveryShipping {
            address {
              firstName
              lastName
              company
              postalCode
              countryCode
              regionCode
              city
              addressLine
              addressLine2
            }
          }
        }
      }
    }
  `),
  mapProps(({ data: { order = {} } }) => ({
    ...order.delivery,
    address: (order.delivery && order.delivery.address) || order.address,
    statusColor: colorForStatus(order.delivery && order.delivery.status),
  })),
  pure,
)(OrderDelivery);
