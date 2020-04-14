import React from 'react';
import AutoField from 'uniforms-semantic/AutoField';
import SubmitField from 'uniforms-semantic/SubmitField';
import ErrorsField from 'uniforms-semantic/ErrorsField';
import AutoForm from 'uniforms-semantic/AutoForm';
import { compose, pure, mapProps, withHandlers } from 'recompose';
import { Item, Segment } from 'semantic-ui-react';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
// import gql from 'graphql-tag';
// import { graphql } from 'react-apollo';
import { SortableContainer } from 'react-sortable-hoc';
import ProductBundleItemListItem from './ProductBundleItemListItem';
import withFormSchema from '../../lib/withFormSchema';

const ProductBundleItemList = ({
  schema,
  allProducts,
  items,
  productId,
  isEditingDisabled,
  addNewBundleItem,
  removeBundleItem,
}) => (
  <Segment>
    <Item.Group divided>
      {items.map(({ product, quantity }, index) => (
        <ProductBundleItemListItem
          /* eslint react/no-array-index-key: 0 */
          key={index}
          index={index}
          product={product}
          quantity={quantity}
          isEditingDisabled={isEditingDisabled}
          allProducts={allProducts}
          removeItem={() => {
            removeBundleItem({ variables: { productId, index } });
          }}
        />
      ))}
    </Item.Group>
    <AutoForm onSubmit={addNewBundleItem} schema={schema}>
      <AutoField
        name={'productId'}
        options={[
          { label: 'Choose Type', value: null },
          ...(allProducts || []).map((product) => ({
            label: product.texts.title,
            value: product._id,
          })),
        ]}
      />
      <AutoField name={'quantity'} />
      <ErrorsField />
      <SubmitField value="Add Product" className="primary" />
    </AutoForm>
  </Segment>
);

export default compose(
  withFormSchema({
    productId: {
      type: String,
      optional: false,
      label: 'Product',
      defaultValue: null,
    },
    quantity: {
      type: Number,
      label: 'Quantity',
      optional: false,
    },
  }),
  graphql(gql`
    query productBundleItems($productId: ID) {
      products {
        _id
        texts {
          _id
          title
        }
      }
      product(productId: $productId) {
        _id
        ... on BundleProduct {
          bundleItems {
            product {
              _id
              texts {
                _id
                title
              }
            }
            quantity
            configuration {
              key
              value
            }
          }
        }
      }
    }
  `),
  graphql(
    gql`
      mutation createProductBundleItem(
        $productId: ID!
        $item: CreateProductBundleItemInput!
      ) {
        createProductBundleItem(productId: $productId, item: $item) {
          _id
        }
      }
    `,
    {
      name: 'createProductBundleItem',
      options: {
        refetchQueries: ['productBundleItems'],
      },
    }
  ),
  graphql(
    gql`
      mutation removeBundleItem($productId: ID!, $index: Int!) {
        removeBundleItem(productId: $productId, index: $index) {
          _id
        }
      }
    `,
    {
      name: 'removeBundleItem',
      options: {
        refetchQueries: ['productBundleItems'],
      },
    }
  ),
  withHandlers({
    addNewBundleItem: ({ productId, createProductBundleItem }) => (item) => {
      createProductBundleItem({
        variables: {
          productId,
          item,
        },
      });
    },
  }),

  mapProps(({ data, ...rest }) => {
    const { product, products: allProducts } = data;
    return {
      items: (product && product.bundleItems) || [],
      allProducts,
      isEditingDisabled: !product || product.status === 'DELETED',
      pressDelay: 200,
      ...rest,
    };
  }),
  pure,
  SortableContainer
)(ProductBundleItemList);
