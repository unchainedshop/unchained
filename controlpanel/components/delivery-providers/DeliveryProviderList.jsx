import gql from 'graphql-tag';
import React from 'react';
import { Table, Icon } from 'semantic-ui-react';
import Link from 'next/link';
import InfiniteDataTable, { withDataTableLoader } from '../InfiniteDataTable';

const DeliveryProviderList = ({ ...rest }) => (
  <InfiniteDataTable
    {...rest}
    cols={4}
    createPath="/delivery-providers/new"
    rowRenderer={(deliveryProvider => (
      <Table.Row key={deliveryProvider._id}>
        <Table.Cell>
          <Link href={`/delivery-providers/edit?_id=${deliveryProvider._id}`}>
            <a href={`/delivery-providers/edit?_id=${deliveryProvider._id}`}>
              {deliveryProvider._id}
            </a>
          </Link>
        </Table.Cell>
        <Table.Cell>
          {deliveryProvider.type}
        </Table.Cell>
        {deliveryProvider.interface ? (
          <Table.Cell>
            {deliveryProvider.interface.label}
            {' '}
            {deliveryProvider.interface.version}
          </Table.Cell>
        ) : (
          <Table.Cell>
            Invalid Interface
          </Table.Cell>
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
  >
    <Table.Row>
      <Table.HeaderCell>
Configuration
      </Table.HeaderCell>
      <Table.HeaderCell>
Type
      </Table.HeaderCell>
      <Table.HeaderCell>
Interface
      </Table.HeaderCell>
      <Table.HeaderCell>
Problems
      </Table.HeaderCell>
    </Table.Row>
  </InfiniteDataTable>
);

export default withDataTableLoader({
  queryName: 'deliveryProviders',
  query: gql`
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
  `,
})(DeliveryProviderList);
