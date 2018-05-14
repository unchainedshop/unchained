import gql from 'graphql-tag';
import React from 'react';
import { Table, Icon } from 'semantic-ui-react';
import Link from 'next/link';
import InfiniteDataTable, { withDataTableLoader } from '../../lib/InfiniteDataTable';

const CurrencyList = ({ ...rest }) => (
  <InfiniteDataTable
    {...rest}
    cols={2}
    createPath="/currencies/new"
    rowRenderer={(currency => (
      <Table.Row key={currency._id}>
        <Table.Cell>
          <Link href={`/currencies/edit?_id=${currency._id}`}>
            <a href={`/currencies/edit?_id=${currency._id}`}>{currency.isoCode}</a>
          </Link>
        </Table.Cell>
        <Table.Cell>
          {currency.isActive && (
            <Icon color="green" name="checkmark" size="large" />
          )}
        </Table.Cell>
      </Table.Row>
    ))}
  >
    <Table.HeaderCell>Code</Table.HeaderCell>
    <Table.HeaderCell>Aktiviert</Table.HeaderCell>
  </InfiniteDataTable>
);

export default withDataTableLoader({
  queryName: 'currencies',
  query: gql`
      query currencies($limit: Int, $offset: Int) {
        currencies(limit: $limit, offset: $offset, includeInactive: true) {
          _id
          isoCode
          isActive
        }
      }
    `,
})(CurrencyList);
