import { compose, withState, withHandlers } from 'recompose';
import gql from 'graphql-tag';
import { graphql } from '@apollo/client/react/hoc';
import React from 'react';
import { Table, Icon, Button } from 'semantic-ui-react';
import Link from 'next/link';
import InfiniteDataTable, { withDataTableLoader } from '../InfiniteDataTable';

const AssortmentList = ({
  isShowLeafNodes,
  setShowLeafNodes,
  loading,
  mutate,
  toggleShowLeafNodes,
  changeBaseAssortment,
  ...rest
}) => (
  <InfiniteDataTable
    {...rest}
    cols={3}
    createPath="/assortments/new"
    rowRenderer={(assortment) => (
      <Table.Row key={assortment._id}>
        <Table.Cell>
          <Link href={`/assortments/edit?_id=${assortment._id}`}>
            <a href={`/assortments/edit?_id=${assortment._id}`}>
              {assortment.texts.title}
            </a>
          </Link>
        </Table.Cell>
        <Table.Cell>
          {assortment.isActive && (
            <Icon color="green" name="checkmark" size="large" />
          )}
        </Table.Cell>
        <Table.Cell>
          {assortment.isBase ? (
            <b>Base</b>
          ) : (
            <Button basic name={assortment._id} onClick={changeBaseAssortment}>
              Define as base assortment
            </Button>
          )}
        </Table.Cell>
      </Table.Row>
    )}
  >
    <Table.Row>
      <Table.HeaderCell colSpan={3}>
        Show non-root nodes? &nbsp;
        <input
          type="checkbox"
          checked={isShowLeafNodes}
          onChange={toggleShowLeafNodes}
        />
      </Table.HeaderCell>
    </Table.Row>
    <Table.Row>
      <Table.HeaderCell>Name</Table.HeaderCell>
      <Table.HeaderCell>Active?</Table.HeaderCell>
      <Table.HeaderCell>Base?</Table.HeaderCell>
    </Table.Row>
  </InfiniteDataTable>
);

export default compose(
  withState('isShowLeafNodes', 'setShowLeafNodes', false),
  withDataTableLoader({
    queryName: 'assortments',
    query: gql`
      query assortments($limit: Int, $offset: Int, $isShowLeafNodes: Boolean) {
        assortments(
          limit: $limit
          offset: $offset
          includeInactive: true
          includeLeaves: $isShowLeafNodes
        ) {
          _id
          isActive
          isBase
          texts {
            _id
            title
          }
        }
      }
    `,
  }),
  graphql(
    gql`
      mutation changeBaseAssortment($assortmentId: ID!) {
        setBaseAssortment(assortmentId: $assortmentId) {
          _id
          isBase
        }
      }
    `,
    {
      options: {
        refetchQueries: ['assortments'],
      },
    }
  ),
  withHandlers({
    changeBaseAssortment: ({ mutate }) => (event, element) =>
      mutate({ variables: { assortmentId: element.name } }),
    toggleShowLeafNodes: ({ isShowLeafNodes, setShowLeafNodes }) => () =>
      setShowLeafNodes(!isShowLeafNodes),
  })
)(AssortmentList);
