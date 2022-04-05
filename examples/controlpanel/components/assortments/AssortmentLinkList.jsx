import React from 'react';
import { compose, pure, withHandlers, mapProps } from 'recompose';
import { Item, Segment } from 'semantic-ui-react';
import gql from 'graphql-tag';
import { graphql } from '@apollo/client/react/hoc';
import { SortableContainer, arrayMove } from 'react-sortable-hoc';
import AssortmentLinkListItem from './AssortmentLinkListItem';
import FormNewAssortmentLink from './FormNewAssortmentLink';

const AssortmentLinkList = ({ assortmentId, items }) => (
  <Segment>
    <Item.Group divided>
      {items.map(({ _id, ...rest }, index) => (
        <AssortmentLinkListItem
          comparedToAssortmentId={assortmentId}
          key={_id}
          index={index}
          _id={_id}
          {...rest}
        />
      ))}
      <Item>
        <Item.Content>
          <FormNewAssortmentLink parentAssortmentId={assortmentId} />
        </Item.Content>
      </Item>
    </Item.Group>
  </Segment>
);

export default compose(
  graphql(gql`
    query assortmentLinks($assortmentId: ID) {
      assortment(assortmentId: $assortmentId) {
        _id
        linkedAssortments {
          _id
          parent {
            _id
            texts {
              _id
              title
            }
          }
          child {
            _id
            texts {
              _id
              title
            }
          }
          tags
        }
      }
    }
  `),
  graphql(
    gql`
      mutation reorderAssortmentLinks($sortKeys: [ReorderAssortmentLinkInput!]!) {
        reorderAssortmentLinks(sortKeys: $sortKeys) {
          _id
          sortKey
        }
      }
    `,
    {
      name: 'reorderAssortmentLinks',
      options: {
        refetchQueries: ['assortmentLinks'],
      },
    },
  ),
  mapProps(({ data: { assortment }, ...rest }) => ({
    items: (assortment && assortment.linkedAssortments) || [],
    useDragHandle: true,
    ...rest,
  })),
  withHandlers({
    onSortEnd:
      ({ items, reorderAssortmentLinks }) =>
      async ({ oldIndex, newIndex }) => {
        const sortKeys = arrayMove(items, oldIndex, newIndex).map((item, sortKey) => ({
          assortmentLinkId: item._id,
          sortKey,
        }));
        await reorderAssortmentLinks({
          variables: {
            sortKeys,
          },
        });
      },
  }),
  pure,
  SortableContainer,
)(AssortmentLinkList);
