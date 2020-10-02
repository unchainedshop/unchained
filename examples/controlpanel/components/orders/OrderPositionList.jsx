import { compose, mapProps, pure } from 'recompose';
import gql from 'graphql-tag';
import { graphql } from '@apollo/client/react/hoc';
import React from 'react';
import { Table, Segment, Label } from 'semantic-ui-react';
import Link from 'next/link';
import FormattedMoney from '../FormattedMoney';

const OrderPositionList = ({ items }) => (
  <Segment secondary>
    <Label horizontal attached="top">
      <Label.Detail>Ordered Items</Label.Detail>
    </Label>
    <Table celled>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>Product</Table.HeaderCell>
          <Table.HeaderCell>Total</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      {items && (
        <Table.Body>
          {items.map((item) => (
            <Table.Row key={item._id}>
              <Table.Cell>
                {item.quantity}
                x&nbsp;
                <Link href={`/products/edit?_id=${item.product._id}`}>
                  <a href={`/products/edit?_id=${item.product._id}`}>
                    {item.product.texts?.title || item.product._id}
                  </a>
                </Link>
              </Table.Cell>
              <Table.Cell>
                <FormattedMoney money={item.total} />
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      )}
    </Table>
  </Segment>
);

export default compose(
  graphql(gql`
    query order($orderId: ID!) {
      order(orderId: $orderId) {
        _id
        items {
          _id
          quantity
          total {
            amount
            currency
          }
          product {
            _id
            texts {
              _id
              slug
              title
              subtitle
            }
          }
        }
      }
    }
  `),
  mapProps(({ data: { order = {} } }) => ({
    items: order.items,
  })),
  pure
)(OrderPositionList);
