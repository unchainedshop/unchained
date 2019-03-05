import {
  compose, mapProps, withHandlers,
} from 'recompose';
import gql from 'graphql-tag';
import Link from 'next/link';
import { graphql } from 'react-apollo';
import { format } from 'date-fns';
import React from 'react';
import {
  List, Segment, Menu, Dropdown,
  Label, Grid,
} from 'semantic-ui-react';
import BtnRemoveQuotation from './BtnRemoveQuotation';

const colorForStatus = (status) => {
  if (status === 'REQUESTED' || status === 'REJECTED') return 'red';
  if (status === 'FULLFILLED') return 'green';
  return 'orange';
};

const QuotationHeader = ({
  _id, status, created, quotationNumber, product, expires, rejected, meta,
  fullfilled, currency, statusColor, verifyQuotation, user, rejectQuotation,
}) => (
  <>
    <Menu fluid attached="top" bquotationless key="header-title">
      <Menu.Item header>
        Quotation
        {' '}
        {quotationNumber || ''}
        &nbsp;
        <small>
          (
          {_id}
          )
        </small>
      </Menu.Item>
      <Menu.Item>
        <Label color={statusColor} horizontal>
          {status}
        </Label>
      </Menu.Item>
      <Menu.Menu position="right">
        <Dropdown item icon="wrench" simple>
          <Dropdown.Menu>
            <Dropdown.Header>
            Options
            </Dropdown.Header>
            <BtnRemoveQuotation
              quotationId={_id}
              Component={Dropdown.Item}
              disabled={status !== 'REQUESTED'}
            >
              Delete
            </BtnRemoveQuotation>
            <Dropdown.Item
              primary
              fluid
              disabled={status !== 'REQUESTED'}
              onClick={verifyQuotation}
            >
              Verify
            </Dropdown.Item>
            <Dropdown.Item
              primary
              fluid
              disabled={status === 'FULLFILLED' || status === 'REJECTED'}
              onClick={rejectQuotation}
            >
              Reject
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </Menu.Menu>
    </Menu>
    <Segment attached key="header-body">
      <Grid>
        <Grid.Row columns={2}>
          <Grid.Column width={10}>
            <List relaxed>
              <List.Item>
                <List.Icon name="money" />
                <List.Content>
                  Currency:
                  {' '}
                  {currency && currency.isoCode}
                </List.Content>
              </List.Item>
              <List.Item>
                <List.Icon name="box" />
                <List.Content>
                  Product:&nbsp;
                  {product && (
                    <Link href={`/products/edit?_id=${product._id}`}>
                      <a href={`/products/edit?_id=${product._id}`}>
                        {`${product.texts.title || product._id}`}
                      </a>
                    </Link>
                  )}
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
              {meta && (
              <List.Item>
                <List.Icon name="user" />
                <List.Content>
                  {JSON.stringify(meta)}
                </List.Content>
              </List.Item>
              )}
            </List>
          </Grid.Column>
          <Grid.Column width={6}>
            <List>
              <List.Item>
                <List.Icon name="add to calendar" />
                <List.Content>
                  Created:
                  {' '}
                  {created
                    ? format(created, 'Pp')
                    : 'n/a'}
                </List.Content>
              </List.Item>
              <List.Item>
                <List.Icon name="hourglass end" />
                <List.Content>
                  Expires:
                  {' '}
                  {expires
                    ? format(expires, 'Ppp')
                    : 'n/a'}
                </List.Content>
              </List.Item>
              <List.Item>
                <List.Icon name="checkmark box" />
                <List.Content>
                  Fullfilled:
                  {' '}
                  {fullfilled
                    ? format(fullfilled, 'Pp')
                    : 'n/a'}
                </List.Content>
              </List.Item>
              <List.Item>
                <List.Icon name="ban" />
                <List.Content>
                  Rejected:
                  {' '}
                  {rejected
                    ? format(rejected, 'Pp')
                    : 'n/a'}
                </List.Content>
              </List.Item>
            </List>
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </Segment>
  </>
);

export default compose(
  graphql(gql`
    mutation verifyQuotation($quotationId: ID!) {
      verifyQuotation(quotationId: $quotationId) {
        _id
        quotationNumber
        status
        created
        updated
        meta
      }
    }
  `, {
    name: 'verifyQuotation',
    options: {
      refetchQueries: [
        'quotations',
        'quotation',
        'quotationLogs',
      ],
    },
  }),
  graphql(gql`
    mutation rejectQuotation($quotationId: ID!) {
      rejectQuotation(quotationId: $quotationId) {
        _id
        quotationNumber
        status
        created
        updated
        rejected
        meta
      }
    }
  `, {
    name: 'rejectQuotation',
    options: {
      refetchQueries: [
        'quotations',
        'quotation',
        'quotationLogs',
      ],
    },
  }),
  graphql(gql`
    query quotation($quotationId: ID!) {
      quotation(quotationId: $quotationId) {
        _id
        quotationNumber
        status
        created
        updated
        rejected
        expires
        fullfilled
        user {
          _id
          name
        }
        product {
          _id
          ... on SimpleProduct {
            sku
          }
          texts {
            _id
            title
          }
        }
        currency {
          _id
          isoCode
        }
        meta
      }
    }
  `),
  withHandlers({
    verifyQuotation: ({ verifyQuotation, quotationId }) => () => verifyQuotation({
      variables: {
        quotationId,
      },
    }),
    rejectQuotation: ({ rejectQuotation, quotationId }) => () => {
      const reason = prompt('Reason', ''); // eslint-disable-line
      return rejectQuotation({
        variables: {
          quotationId,
          quotationContext: {
            reason,
          },
        },
      });
    },
  }),
  mapProps(({
    verifyQuotation,
    rejectQuotation,
    data: { quotation = {} },
  }) => ({
    statusColor: colorForStatus(quotation.status),
    verifyQuotation,
    rejectQuotation,
    ...quotation,
  })),
)(QuotationHeader);
