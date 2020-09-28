import React from 'react';
import { compose, withHandlers } from 'recompose';
import { Item, Button, Icon, List, Label } from 'semantic-ui-react';
import { SortableElement, SortableHandle } from 'react-sortable-hoc';
import gql from 'graphql-tag';
import { graphql } from '@apollo/client/react/hoc';
import Link from 'next/link';

const DragHandle = SortableHandle(() => (
  <Icon name="arrows alternate vertical" link size="small" />
));

const AssortmentProductListItem = ({
  product,
  tags,
  removeAssortmentProduct,
}) => (
  <Item>
    <Item.Content>
      <Item.Header>
        <List as="ol">
          <List.Item as="li" value="">
            <DragHandle />
            <Link href={`/products/edit?_id=${product._id}`}>
              <>
                <a href={`/products/edit?_id=${product._id}`}>
                  {product.texts?.title}
                </a>
                {tags &&
                  tags.map((tag) => {
                    return <Label>{tag}</Label>;
                  })}
              </>
            </Link>
          </List.Item>
        </List>
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
