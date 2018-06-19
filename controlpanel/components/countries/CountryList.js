import { compose, pure, withHandlers } from 'recompose';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import React from 'react';
import { Table, Icon, Button } from 'semantic-ui-react';
import Link from 'next/link';
import InfiniteDataTable, { withDataTableLoader } from '../../lib/InfiniteDataTable';

const CountryList = ({ changeBaseCountry, ...rest }) => (
  <InfiniteDataTable
    {...rest}
    cols={3}
    createPath="/countries/new"
    rowRenderer={(country => (
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
        <Table.Cell>
          {country.isBase ? (
            <b>Basisland</b>
          ) : (
            <Button
              basic
              name={country._id}
              onClick={changeBaseCountry}
            >
            Als Basisland festlegen
            </Button>
          )}
        </Table.Cell>
      </Table.Row>
    ))}
  >
    <Table.Row>
      <Table.HeaderCell>Name</Table.HeaderCell>
      <Table.HeaderCell>Active?</Table.HeaderCell>
      <Table.HeaderCell>Basisland</Table.HeaderCell>
    </Table.Row>
  </InfiniteDataTable>
);

export default compose(
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
  graphql(gql`
    mutation changeBaseCountry($countryId: ID!) {
      setBaseCountry(countryId: $countryId) {
        _id
        isBase
      }
    }
  `, {
    options: {
      refetchQueries: [
        'countries',
      ],
    },
  }),
  withHandlers({
    changeBaseCountry: ({ mutate }) => (event, element) =>
      mutate({ variables: { countryId: element.name } }),
  }),
  pure,
)(CountryList);
