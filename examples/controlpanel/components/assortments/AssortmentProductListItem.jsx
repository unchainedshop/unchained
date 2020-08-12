import React from 'react';
import { compose, withHandlers } from 'recompose';
import { Item, Button, Icon } from 'semantic-ui-react';
import { SortableElement, SortableHandle } from 'react-sortable-hoc';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';

const DragHandle = SortableHandle(() => (
  <Icon name="arrows alternate vertical" link size="small" />
));

const AssortmentProductListItem = ({ product, removeAssortmentProduct }) => (
  <Item>
    <Item.Content>
      <DragHandle />
      <Item.Header>
        <a href={`/products/edit?_id=${product._id}`}>
          {product.texts && product.texts.title}
        </a>
      </Item.Header>
      <Item.Extra>
        <Button secondary floated="right" onClick={removeAssortmentProduct}>
          Delete
        </Button>
      </Item.Extra>
    </Item.Content>
  </Item>
);

export default compose(
  graphql(
    gql`
      mutation removeAssortmentProduct($assortmentProductId: ID!) {
        removeAssortmentProduct(assortmentProductId: $assortmentProductId) {
          _id
        }
      }
    `,
    {
      name: 'removeAssortmentProduct',
      options: {
        refetchQueries: ['assortmentProducts'],
      },
    }
  ),
  withHandlers({
    removeAssortmentProduct: ({ removeAssortmentProduct, _id }) => async () => {
      await removeAssortmentProduct({
        variables: {
          assortmentProductId: _id,
        },
      });
    },
  }),
  SortableElement
)(AssortmentProductListItem);
