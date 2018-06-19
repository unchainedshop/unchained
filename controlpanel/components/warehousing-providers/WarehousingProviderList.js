import gql from 'graphql-tag';
import React from 'react';
import { Table, Icon } from 'semantic-ui-react';
import Link from 'next/link';
import InfiniteDataTable, { withDataTableLoader } from '../../lib/InfiniteDataTable';

const WarehousingProviderList = ({ ...rest }) => (
  <InfiniteDataTable
    {...rest}
    cols={4}
    createPath="/warehousing-providers/new"
    rowRenderer={(warehousingProvider => (
      <Table.Row key={warehousingProvider._id}>
        <Table.Cell>
          <Link href={`/warehousing-providers/edit?_id=${warehousingProvider._id}`}>
            <a href={`/warehousing-providers/edit?_id=${warehousingProvider._id}`}>{warehousingProvider._id}</a>
          </Link>
        </Table.Cell>
        <Table.Cell>
          {warehousingProvider.type}
        </Table.Cell>
        {warehousingProvider.interface ? (
          <Table.Cell>
            {warehousingProvider.interface.label} {warehousingProvider.interface.version}
          </Table.Cell>
        ) : (
          <Table.Cell>
            Invalid Interface
          </Table.Cell>
        )}
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
  >
    <Table.Row>
      <Table.HeaderCell>Configuration</Table.HeaderCell>
      <Table.HeaderCell>Type</Table.HeaderCell>
      <Table.HeaderCell>Interface</Table.HeaderCell>
      <Table.HeaderCell>Problems</Table.HeaderCell>
    </Table.Row>
  </InfiniteDataTable>
);

export default withDataTableLoader({
  queryName: 'warehousingProviders',
  query: gql`
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
  `,
})(WarehousingProviderList);
