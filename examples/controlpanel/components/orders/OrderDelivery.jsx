import { compose, mapProps, withHandlers } from 'recompose';
import gql from 'graphql-tag';
import { format } from 'date-fns';
import { graphql } from 'react-apollo';
import React from 'react';
import { Segment, List, Label, Icon, Button } from 'semantic-ui-react';
import Link from 'next/link';
import Address from '../Address';
import GeoPoint from '../GeoPoint';

const colorForStatus = status => {
  if (status === 'DELIVERED') return 'green';
  return 'red';
};

const OrderDelivery = ({
  provider = { interface: {} },
  status,
  deliveryAddress,
  deliverOrder,
  statusColor,
  orderStatus,
  delivered,
  activePickUpLocation
}) => (
  <Segment secondary>
    <Label color={statusColor} horizontal attached="top">
      {status}
      <Label.Detail>Delivery Provider</Label.Detail>
    </Label>
    <List relaxed divided>
      <List.Item>
        <Label horizontal basic>
          <Icon name="ship" />
          {provider && provider.interface && (
            <Link href={`/delivery-providers/edit?_id=${provider._id}`}>
              <a href={`/delivery-providers/edit?_id=${provider._id}`}>
                {provider.interface.label} {provider.interface.version} (
                {provider.type})
              </a>
            </Link>
          )}
        </Label>
        <List>
          <List.Item>
            Date of Delivery to Provider:{' '}
            {delivered ? format(delivered, 'Pp') : 'n/a'}
          </List.Item>
        </List>
      </List.Item>
      {deliveryAddress && (
        <List.Item>
          <Label horizontal basic>
            <Icon name="mail" />
            Delivery Address
          </Label>
          <Address {...deliveryAddress} />
        </List.Item>
      )}
      {activePickUpLocation && (
        <List.Item>
          <Label horizontal basic>
            <Icon name="mail" />
            Active Pickup Location
          </Label>
          <List>
            <List.Item>{activePickUpLocation.name}</List.Item>
          </List>
          {activePickUpLocation.address && (
            <Address {...activePickUpLocation.address} />
          )}
          {activePickUpLocation.geoPoint && (
            <GeoPoint {...activePickUpLocation.geoPoint} />
          )}
        </List.Item>
      )}
    </List>
    {status === 'OPEN' && orderStatus !== 'OPEN' && (
      <Button primary fluid onClick={deliverOrder}>
        Mark Order as DELIVERED manually
      </Button>
    )}
  </Segment>
);

export default compose(
  graphql(
    gql`
      mutation deliverOrder($orderId: ID!) {
        deliverOrder(orderId: $orderId) {
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
    `,
    {
      name: 'deliverOrder',
      options: {
        refetchQueries: ['orders', 'order']
      }
    }
  ),
  graphql(gql`
    query order($orderId: ID!) {
      order(orderId: $orderId) {
        _id
        status
        billingAddress {
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
            activePickUpLocation {
              _id
              name
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
              geoPoint {
                latitude
                longitude
                altitute
              }
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
  withHandlers({
    deliverOrder: ({ deliverOrder, orderId }) => () =>
      deliverOrder({
        variables: {
          orderId
        }
      })
  }),
  mapProps(({ deliverOrder, data: { order = {} } }) => ({
    ...order.delivery,
    deliverOrder,
    deliveryAddress: order.delivery && order.delivery.address,
    activePickUpLocation: order.delivery && order.delivery.activePickUpLocation,
    statusColor: colorForStatus(order.delivery && order.delivery.status),
    orderStatus: order.status
  }))
)(OrderDelivery);
