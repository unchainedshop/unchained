import { compose, mapProps, withHandlers, pure } from 'recompose';
import gql from 'graphql-tag';
import Link from 'next/link';
import { graphql } from '@apollo/client/react/hoc';
import { format } from 'date-fns';
import React from 'react';
import {
  List,
  Segment,
  Menu,
  Dropdown,
  Label,
  Icon,
  Grid,
} from 'semantic-ui-react';
import Address from '../Address';
import BtnRemoveOrder from './BtnRemoveOrder';

const colorForStatus = (status) => {
  if (status === 'OPEN') return 'red';
  if (status === 'FULLFILLED') return 'green';
  return 'orange';
};

const OrderHeader = ({
  _id,
  status,
  created,
  ordered,
  orderNumber,
  confirmed,
  country,
  contact,
  fullfilled,
  currency,
  billingAddress,
  statusColor,
  confirmOrder,
  user,
}) => [
  <Menu fluid attached="top" borderless key="header-title">
    <Menu.Item header>
      Order {orderNumber || ''}
      &nbsp;
      <small>({_id})</small>
    </Menu.Item>
    <Menu.Item>
      <Label color={statusColor} horizontal>
        {status}
      </Label>
    </Menu.Item>
    <Menu.Menu position="right">
      <Dropdown item icon="wrench" simple>
        <Dropdown.Menu>
          <Dropdown.Header>Options</Dropdown.Header>
          <BtnRemoveOrder
            orderId={_id}
            Component={Dropdown.Item}
            disabled={status !== 'OPEN'}
          >
            Delete
          </BtnRemoveOrder>
          <Dropdown.Item
            primary
            fluid
            disabled={status !== 'PENDING'}
            onClick={confirmOrder}
          >
            Confirm
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    </Menu.Menu>
  </Menu>,
  <Segment attached key="header-body">
    <Grid>
      <Grid.Row columns={2}>
        <Grid.Column width={10}>
          <List relaxed>
            <List.Item>
              <List.Icon name="money" />
              <List.Content>
                Currency: {currency && currency.isoCode}
              </List.Content>
            </List.Item>
            <List.Item>
              <List.Icon name="world" />
              <List.Content>
                Shop: {country && `${country.flagEmoji} (${country.isoCode})`}
              </List.Content>
            </List.Item>
            {user && (
              <List.Item>
                <List.Icon name="user" />
                <List.Content>
                  User:&nbsp;
                  <Link href={`/users/edit?_id=${user._id}`}>
                    <a href={`/users/edit?_id=${user._id}`}>
                      {`${user.name || user._id}`}
                    </a>
                  </Link>
                </List.Content>
              </List.Item>
            )}
            {contact && (
              <List.Item>
                <List.Icon name="mail" />
                <List.Content>
                  E-Mail:
                  {`${contact.emailAddress}`}
                </List.Content>
              </List.Item>
            )}
            <List.Item>
              <Label horizontal basic>
                <Icon name="mail" />
                Invoice Address
              </Label>
              <Address {...billingAddress} />
            </List.Item>
          </List>
        </Grid.Column>
        <Grid.Column width={6}>
          <List>
            <List.Item>
              <List.Icon name="add to calendar" />
              <List.Content>
                Created: {created ? format(created, 'Pp') : 'n/a'}
              </List.Content>
            </List.Item>
            <List.Item>
              <List.Icon name="plus cart" />
              <List.Content>
                Ordered: {ordered ? format(ordered, 'Pp') : 'n/a'}
              </List.Content>
            </List.Item>
            <List.Item>
              <List.Icon name="thumbs outline up" />
              <List.Content>
                Confirmed: {confirmed ? format(confirmed, 'Pp') : 'n/a'}
              </List.Content>
            </List.Item>
            <List.Item>
              <List.Icon name="checkmark box" />
              <List.Content>
                Fullfilled: {fullfilled ? format(fullfilled, 'Pp') : 'n/a'}
              </List.Content>
            </List.Item>
          </List>
        </Grid.Column>
      </Grid.Row>
    </Grid>
  </Segment>,
];

export default compose(
  graphql(
    gql`
      mutation confirmOrder($orderId: ID!) {
        confirmOrder(orderId: $orderId) {
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
      name: 'confirmOrder',
      options: {
        refetchQueries: ['orders', 'order'],
      },
    }
  ),
  graphql(gql`
    query order($orderId: ID!) {
      order(orderId: $orderId) {
        _id
        orderNumber
        status
        created
        updated
        ordered
        confirmed
        fullfilled
        user {
          _id
          name
        }
        contact {
          emailAddress
        }
        currency {
          _id
          isoCode
        }
        country {
          _id
          isoCode
          flagEmoji
        }
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
      }
    }
  `),
  withHandlers({
    confirmOrder: ({ confirmOrder, orderId }) => () =>
      confirmOrder({
        variables: {
          orderId,
        },
      }),
  }),
  mapProps(({ confirmOrder, data: { order = {} } }) => ({
    statusColor: colorForStatus(order.status),
    confirmOrder,
    ...order,
  })),
  pure
)(OrderHeader);
