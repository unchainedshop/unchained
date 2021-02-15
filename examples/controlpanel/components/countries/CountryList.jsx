import { compose, pure, defaultProps } from 'recompose';
import gql from 'graphql-tag';
import React from 'react';
import { Table, Icon } from 'semantic-ui-react';
import Link from 'next/link';
import InfiniteDataTable, { withDataTableLoader } from '../InfiniteDataTable';

const CountryList = ({ ...rest }) => (
  <InfiniteDataTable
    {...rest}
    cols={3}
    createPath="/countries/new"
    rowRenderer={(country) => (
      <Table.Row key={country._id}>
        <Table.Cell>
          <Link href={`/countries/edit?_id=${country._id}`}>
            <a href={`/countries/edit?_id=${country._id}`}>{country.isoCode}</a>
          </Link>
        </Table.Cell>
        <Table.Cell>
          {country.isActive && (
            <Icon color="green" name="checkmark" size="large" />
          )}
        </Table.Cell>
        <Table.Cell>{country.isBase ? <b>Base Country</b> : null}</Table.Cell>
      </Table.Row>
    )}
  >
    <Table.Row>
      <Table.HeaderCell>Name</Table.HeaderCell>
      <Table.HeaderCell>Active?</Table.HeaderCell>
      <Table.HeaderCell>Base Country</Table.HeaderCell>
    </Table.Row>
  </InfiniteDataTable>
);

export default compose(
  defaultProps({ limit: 20, offset: 0 }),
  withDataTableLoader({
    queryName: 'countries',
    query: gql`
      query countries($limit: Int, $offset: Int) {
        countries(limit: $limit, offset: $offset, includeInactive: true) {
          _id
          isoCode
          isActive
          isBase
          name
        }
      }
    `,
  }),
  pure
)(CountryList);
