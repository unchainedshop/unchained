import React from 'react';
import { compose, pure, withHandlers, mapProps } from 'recompose';
import { Item, Segment } from 'semantic-ui-react';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import { SortableContainer, arrayMove } from 'react-sortable-hoc';
import AssortmentProductListItem from './AssortmentProductListItem';
import FormNewAssortmentProduct from './FormNewAssortmentProduct';

const AssortmentProductList = ({ assortmentId, items }) => (
  <Segment>
    <Item.Group divided>
      {items.map(({ _id, ...rest }, index) => (
        <AssortmentProductListItem
          key={_id}
          index={index}
          _id={_id}
          {...rest}
        />
      ))}
      <Item>
        <Item.Content>
          <FormNewAssortmentProduct assortmentId={assortmentId} />
        </Item.Content>
      </Item>
    </Item.Group>
  </Segment>
);

export default compose(
  graphql(gql`
    query assortmentProducts($assortmentId: ID) {
      assortment(assortmentId: $assortmentId) {
        _id
        productAssignments {
          _id
          product {
            _id
            texts {
              _id
              title
            }
          }
        }
      }
    }
  `),
  graphql(
    gql`
      mutation reorderAssortmentProducts(
        $sortKeys: [ReorderAssortmentProductInput!]!
      ) {
        reorderAssortmentProducts(sortKeys: $sortKeys) {
          _id
          sortKey
        }
      }
    `,
    {
      name: 'reorderAssortmentProducts',
      options: {
        refetchQueries: ['assortmentProducts'],
      },
    }
  ),
  mapProps(({ data: { assortment }, ...rest }) => ({
    items: (assortment && assortment.productAssignments) || [],
    ...rest,
  })),
  withHandlers({
    onSortEnd: ({ items, reorderAssortmentProducts }) => async ({
      oldIndex,
      newIndex,
    }) => {
      const sortKeys = arrayMove(items, oldIndex, newIndex).map(
        (item, sortKey) => ({
          assortmentProductId: item._id,
          sortKey,
        })
      );
      await reorderAssortmentProducts({
        variables: {
          sortKeys,
        },
      });
    },
    useDragHandle: true,
  }),
  pure,
  SortableContainer
)(AssortmentProductList);
