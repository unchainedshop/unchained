import { compose, withState, withHandlers, defaultProps } from 'recompose';
import React from 'react';
import { withRouter } from 'next/router';
import { Table, Icon } from 'semantic-ui-react';
import Link from 'next/link';
import gql from 'graphql-tag';
import InfiniteDataTable, { withDataTableLoader } from '../InfiniteDataTable';
import SearchDropdown from '../SearchDropdown';
import AssortmentChangeBaseButton from './AssortmentChangeBaseButton';
import { SEARCH_ASSORTMENTS } from '../searchQueries';

const AssortmentList = ({
  isShowLeafNodes,
  setShowLeafNodes,
  loading,
  mutate,
  router,
  toggleShowLeafNodes,
  changeBaseAssortment,
  ...rest
}) => (
  <InfiniteDataTable
    {...rest}
    cols={3}
    createPath="/assortments/new"
    searchComponent={
      <SearchDropdown
        placeholder="Select Assortment"
        searchQuery={SEARCH_ASSORTMENTS}
        onChange={(e, result) => {
          router.push({
            pathname: '/assortments/edit',
            query: { _id: result.value },
          });
        }}
        queryType={'assortments'}
      />
    }
    rowRenderer={(assortment) => (
      <Table.Row key={assortment._id}>
        <Table.Cell>
          <Link href={`/assortments/edit?_id=${assortment._id}`}>
            <a href={`/assortments/edit?_id=${assortment._id}`}>
              {assortment.texts?.title}
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
            <AssortmentChangeBaseButton assortmentId={assortment._id} />
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
  defaultProps({ limit: 20, offset: 0 }),
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
  withRouter,
  withHandlers({
    toggleShowLeafNodes:
      ({ isShowLeafNodes, setShowLeafNodes }) =>
      () =>
        setShowLeafNodes(!isShowLeafNodes),
  })
)(AssortmentList);
