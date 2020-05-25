import gql from 'graphql-tag';
import React from 'react';
import { Table, Icon } from 'semantic-ui-react';
import Link from 'next/link';
import InfiniteDataTable, { withDataTableLoader } from '../InfiniteDataTable';

const PaymentProviderList = ({ ...rest }) => (
  <InfiniteDataTable
    {...rest}
    limit={0}
    cols={4}
    createPath="/payment-providers/new"
    rowRenderer={(paymentProvider) => (
      <Table.Row key={paymentProvider._id}>
        <Table.Cell>
          <Link href={`/payment-providers/edit?_id=${paymentProvider._id}`}>
            <a href={`/payment-providers/edit?_id=${paymentProvider._id}`}>
              {paymentProvider._id}
            </a>
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
    )}
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
  queryName: 'paymentProviders',
  query: gql`
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
  `,
})(PaymentProviderList);
