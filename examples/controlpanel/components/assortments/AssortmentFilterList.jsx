import React from 'react';
import { compose, pure, withHandlers, mapProps } from 'recompose';
import { Item, Segment } from 'semantic-ui-react';
import gql from 'graphql-tag';
import { graphql } from '@apollo/client/react/hoc';
import { SortableContainer, arrayMove } from 'react-sortable-hoc';
import AssortmentFilterListItem from './AssortmentFilterListItem';
import FormNewAssortmentFilter from './FormNewAssortmentFilter';

const AssortmentFilterList = ({ assortmentId, items }) => (
  <Segment>
    <Item.Group divided>
      {items.map(({ _id, ...rest }, index) => (
        <AssortmentFilterListItem key={_id} index={index} _id={_id} {...rest} />
      ))}
      <Item>
        <Item.Content>
          <FormNewAssortmentFilter assortmentId={assortmentId} />
        </Item.Content>
      </Item>
    </Item.Group>
  </Segment>
);

export default compose(
  graphql(gql`
    query assortmentFilters($assortmentId: ID) {
      assortment(assortmentId: $assortmentId) {
        _id
        filterAssignments {
          _id
          tags
          filter {
            _id
            key
            texts {
              _id
              title
            }
          }
          assortment {
            _id
          }
        }
      }
    }
  `),
  graphql(
    gql`
      mutation reorderAssortmentFilters(
        $sortKeys: [ReorderAssortmentFilterInput!]!
      ) {
        reorderAssortmentFilters(sortKeys: $sortKeys) {
          _id
          sortKey
        }
      }
    `,
    {
      name: 'reorderAssortmentFilters',
      options: {
        refetchQueries: ['assortmentFilters'],
      },
    }
  ),
  mapProps(({ data: { assortment }, ...rest }) => ({
    items: (assortment && assortment.filterAssignments) || [],
    useDragHandle: true,
    ...rest,
  })),
  withHandlers({
    onSortEnd:
      ({ items, reorderAssortmentFilters }) =>
      async ({ oldIndex, newIndex }) => {
        const sortKeys = arrayMove(items, oldIndex, newIndex).map(
          (item, sortKey) => ({
            assortmentFilterId: item._id,
            sortKey,
          })
        );
        await reorderAssortmentFilters({
          variables: {
            sortKeys,
          },
        });
      },
  }),
  pure,
  SortableContainer
)(AssortmentFilterList);
