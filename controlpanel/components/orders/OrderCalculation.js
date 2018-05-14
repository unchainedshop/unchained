import { compose, mapProps, pure } from 'recompose';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import React from 'react';
import { Table, Segment, Label } from 'semantic-ui-react';
import FormattedMoney from '../FormattedMoney';

const OrderPositionList = ({
  items, delivery, payment, taxes, net, discounts,
}) => (
  <Segment secondary>
    <Label horizontal attached="top">
      <Label.Detail>Price Calculation</Label.Detail>
    </Label>
    <Table celled>
      <Table.Body>
        <Table.Row>
          <Table.Cell>
            Items (Gross total)
          </Table.Cell>
          <Table.Cell>
            <FormattedMoney money={items} />
          </Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell>
            Delivery fees
          </Table.Cell>
          <Table.Cell>
            <FormattedMoney money={delivery} />
          </Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell>
            Payment fees
          </Table.Cell>
          <Table.Cell>
            <FormattedMoney money={payment} />
          </Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell>
            Discounts (on Order)
          </Table.Cell>
          <Table.Cell>
            <FormattedMoney money={discounts} />
          </Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell>
            Taxes
          </Table.Cell>
          <Table.Cell>
            <FormattedMoney money={taxes} />
          </Table.Cell>
        </Table.Row>
      </Table.Body>
      <Table.Footer>
        <Table.Row>
          <Table.HeaderCell>
            Total (Net price)
          </Table.HeaderCell>
          <Table.HeaderCell >
            <FormattedMoney money={net} />
          </Table.HeaderCell>
        </Table.Row>
      </Table.Footer>
    </Table>

  </Segment>
);

export default compose(
  graphql(gql`
    query order($orderId: ID!) {
      order(orderId: $orderId) {
        _id
        items: total(category: ITEMS) {
          amount
          currency
        }
        payment: total(category: PAYMENT) {
          amount
          currency
        }
        delivery: total(category: DELIVERY) {
          amount
          currency
        }
        taxes: total(category: TAXES) {
          amount
          currency
        }
        discounts: total(category: DISCOUNTS) {
          amount
          currency
        }
        net: total {
          amount
          currency
        }
      }
    }
  `),
  mapProps(({ data: { order = {} } }) => (order)),
  pure,
)(OrderPositionList);
