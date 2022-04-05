import gql from 'graphql-tag';
import React from 'react';
import { Table, Icon, Button } from 'semantic-ui-react';
import Link from 'next/link';
import { useQuery } from '@apollo/client';

export const PAYMENT_PROVIDERS_QUERY = gql`
  query paymentProviders {
    paymentProviders {
      _id
      type
      configurationError
      interface {
        _id
        label
        version
      }
    }
  }
`;

export default function PaymentProviderList() {
  const { data, loading } = useQuery(PAYMENT_PROVIDERS_QUERY);
  return (
    <Table celled loading={loading.toString()}>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell colSpan={4}>
            <Link href="/payment-providers/new">
              <Button
                floated="right"
                icon
                labelPosition="left"
                primary
                size="small"
                href="/payment-providers/new"
              >
                <Icon name="plus" />
                Add
              </Button>
            </Link>
          </Table.HeaderCell>
        </Table.Row>
        <Table.Row>
          <Table.HeaderCell>Configuration</Table.HeaderCell>
          <Table.HeaderCell>Type</Table.HeaderCell>
          <Table.HeaderCell>Interface</Table.HeaderCell>
          <Table.HeaderCell>Problems</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {data?.paymentProviders?.map((paymentProvider) => (
          <Table.Row key={paymentProvider._id}>
            <Table.Cell>
              <Link href={`/payment-providers/edit?_id=${paymentProvider._id}`}>
                <a href={`/payment-providers/edit?_id=${paymentProvider._id}`}>{paymentProvider._id}</a>
              </Link>
            </Table.Cell>
            <Table.Cell>{paymentProvider.type}</Table.Cell>
            <Table.Cell>
              {paymentProvider.interface && paymentProvider.interface.label}
              &nbsp;
              {paymentProvider.interface && paymentProvider.interface.version}
            </Table.Cell>
            <Table.Cell>
              {paymentProvider.configurationError && (
                <span>
                  <Icon color="red" name="close" />
                  Configuration Errors
                </span>
              )}
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
      <Table.Footer fullWidth>
        <Table.Row>
          <Table.HeaderCell colSpan={4}>
            <Link href="/payment-providers/new">
              <Button
                floated="right"
                icon
                labelPosition="left"
                primary
                size="small"
                href="/payment-providers/new"
              >
                <Icon name="plus" />
                Add
              </Button>
            </Link>
          </Table.HeaderCell>
        </Table.Row>
      </Table.Footer>
    </Table>
  );
}
