import gql from 'graphql-tag';
import React from 'react';
import { Table, Icon, Button } from 'semantic-ui-react';
import Link from 'next/link';
import { useQuery } from '@apollo/client';

export const WAREHOUSING_PROVIDERS_QUERY = gql`
  query warehousingProviders {
    warehousingProviders {
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

export default function WarehousingProviderList() {
  const { data, loading } = useQuery(WAREHOUSING_PROVIDERS_QUERY);
  return (
    <Table celled loading={loading.toString()}>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell colSpan={4}>
            <Link href="/warehousing-providers/new">
              <Button
                floated="right"
                icon
                labelPosition="left"
                primary
                size="small"
                href="/warehousing-providers/new"
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
        {data?.warehousingProviders?.map((warehousingProvider) => (
          <Table.Row key={warehousingProvider._id}>
            <Table.Cell>
              <Link
                href={`/warehousing-providers/edit?_id=${warehousingProvider._id}`}
              >
                <a
                  href={`/warehousing-providers/edit?_id=${warehousingProvider._id}`}
                >
                  {warehousingProvider._id}
                </a>
              </Link>
            </Table.Cell>
            <Table.Cell>{warehousingProvider.type}</Table.Cell>
            <Table.Cell>
              {warehousingProvider.interface &&
                warehousingProvider.interface.label}
              &nbsp;
              {warehousingProvider.interface &&
                warehousingProvider.interface.version}
            </Table.Cell>
            <Table.Cell>
              {warehousingProvider.configurationError && (
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
            <Link href="/warehousing-providers/new">
              <Button
                floated="right"
                icon
                labelPosition="left"
                primary
                size="small"
                href="/warehousing-providers/new"
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
