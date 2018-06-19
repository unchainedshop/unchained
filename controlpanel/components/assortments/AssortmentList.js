import { compose, pure, withHandlers } from 'recompose';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import React from 'react';
import { Table, Icon, Button } from 'semantic-ui-react';
import Link from 'next/link';
import InfiniteDataTable, { withDataTableLoader } from '../../lib/InfiniteDataTable';

const AssortmentList = ({ changeBaseAssortment, ...rest }) => (
  <InfiniteDataTable
    {...rest}
    cols={3}
    createPath="/assortments/new"
    rowRenderer={(assortment => (
      <Table.Row key={assortment._id}>
        <Table.Cell>
          <Link href={`/assortments/edit?_id=${assortment._id}`}>
            <a href={`/assortments/edit?_id=${assortment._id}`}>{assortment.texts.title}</a>
          </Link>
        </Table.Cell>
        <Table.Cell>
          {assortment.isActive && (
            <Icon color="green" name="checkmark" size="large" />
          )}
        </Table.Cell>
        <Table.Cell>
          {assortment.isBase ? (
            <b>Root</b>
          ) : (
            <Button
              basic
              name={assortment._id}
              onClick={changeBaseAssortment}
            >
            Define as base assortment
            </Button>
          )}
        </Table.Cell>
      </Table.Row>
    ))}
  >
    <Table.HeaderCell>Name</Table.HeaderCell>
    <Table.HeaderCell>Active?</Table.HeaderCell>
    <Table.HeaderCell>Base?</Table.HeaderCell>
  </InfiniteDataTable>
);

export default compose(
  withDataTableLoader({
    queryName: 'assortments',
    query: gql`
      query assortments($limit: Int, $offset: Int) {
        assortments(limit: $limit, offset: $offset, includeInactive: true) {
          _id
          isActive
          isBase
          texts {
            title
          }
        }
      }
    `,
  }),
  graphql(gql`
    mutation changeBaseAssortment($assortmentId: ID!) {
      setBaseAssortment(assortmentId: $assortmentId) {
        _id
        isBase
      }
    }
  `, {
    options: {
      refetchQueries: [
        'assortments',
      ],
    },
  }),
  withHandlers({
    changeBaseAssortment: ({ mutate }) => (event, element) =>
      mutate({ variables: { assortmentId: element.name } }),
  }),
  pure,
)(AssortmentList);
