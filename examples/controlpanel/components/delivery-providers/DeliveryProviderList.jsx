import gql from 'graphql-tag';
import React from 'react';
import { Table, Icon, Button } from 'semantic-ui-react';
import Link from 'next/link';
import { useQuery } from '@apollo/client';

export const DELIVERY_PROVIDERS_QUERY = gql`
  query deliveryProviders {
    deliveryProviders {
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

export default function DeliveryProviderList() {
  const { data, loading } = useQuery(DELIVERY_PROVIDERS_QUERY);
  return (
    <Table celled loading={loading.toString()}>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell colSpan={4}>
            <Link href="/delivery-providers/new">
              <Button
                floated="right"
                icon
                labelPosition="left"
                primary
                size="small"
                href="/delivery-providers/new"
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
        {data?.deliveryProviders?.map((deliveryProvider) => (
          <Table.Row key={deliveryProvider._id}>
            <Table.Cell>
              <Link href={`/delivery-providers/edit?_id=${deliveryProvider._id}`}>
                <a href={`/delivery-providers/edit?_id=${deliveryProvider._id}`}>
                  {deliveryProvider._id}
                </a>
              </Link>
            </Table.Cell>
            <Table.Cell>{deliveryProvider.type}</Table.Cell>
            {deliveryProvider.interface ? (
              <Table.Cell>
                {deliveryProvider.interface.label} {deliveryProvider.interface.version}
              </Table.Cell>
            ) : (
              <Table.Cell>Invalid Interface</Table.Cell>
            )}
            <Table.Cell>
              {deliveryProvider.configurationError && (
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
            <Link href="/delivery-providers/new">
              <Button
                floated="right"
                icon
                labelPosition="left"
                primary
                size="small"
                href="/delivery-providers/new"
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
