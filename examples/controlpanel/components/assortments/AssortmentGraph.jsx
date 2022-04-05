import { compose, withState, withHandlers } from 'recompose';
import gql from 'graphql-tag';
import { graphql } from '@apollo/client/react/hoc';
import React from 'react';
import { withRouter } from 'next/router';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Button, Icon, Table } from 'semantic-ui-react';
import SearchDropdown from '../SearchDropdown';
import { SEARCH_ASSORTMENTS } from '../searchQueries';

const CytoscapeComponentWithNoSSR = dynamic(
  () => import('./CytoscapeComponent'),
  { ssr: false }, // because of a window object
);

const AssortmentGraph = ({ data, router }) => (
  <Table celled>
    <Table.Header>
      <Table.Row>
        <Table.HeaderCell colSpan="3">
          <SearchDropdown
            placeholder="Select Assortment"
            onChange={(e, result) => {
              router.push({
                pathname: '/assortments/edit',
                query: { _id: result.value },
              });
            }}
            searchQuery={SEARCH_ASSORTMENTS}
            queryType={'assortments'}
          />
          <Link href="/assortments/new">
            <Button
              floated="right"
              icon
              labelPosition="left"
              primary
              size="small"
              href="/assortments/new"
            >
              <Icon name="plus" />
              Add
            </Button>
          </Link>
        </Table.HeaderCell>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      <Table.Row>
        <Table.Cell>
          <CytoscapeComponentWithNoSSR assortments={data.assortments} />
        </Table.Cell>
      </Table.Row>
    </Table.Body>
    <Table.Footer fullWidth>
      <Table.Row>
        <Table.HeaderCell colSpan="3">
          <Link href="/assortments/new">
            <Button
              floated="right"
              icon
              labelPosition="left"
              primary
              size="small"
              href="/assortments/new"
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

export default compose(
  withState('isShowLeafNodes', 'setShowLeafNodes', false),
  withRouter,
  graphql(gql`
    query assortments($limit: Int, $offset: Int, $isShowLeafNodes: Boolean) {
      assortments(
        limit: $limit
        offset: $offset
        includeInactive: true
        includeLeaves: $isShowLeafNodes
      ) {
        _id
        texts {
          _id
          title
        }
        linkedAssortments {
          _id
          parent {
            _id
          }
          child {
            _id
          }
        }
      }
    }
  `),
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
    },
  ),
  withHandlers({
    changeBaseAssortment:
      ({ mutate }) =>
      (event, element) =>
        mutate({ variables: { assortmentId: element.name } }),
    toggleShowLeafNodes:
      ({ isShowLeafNodes, setShowLeafNodes }) =>
      () =>
        setShowLeafNodes(!isShowLeafNodes),
  }),
)(AssortmentGraph);
