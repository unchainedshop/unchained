import React from 'react';
import { compose, pure, mapProps } from 'recompose';
import { Segment, List } from 'semantic-ui-react';
import gql from 'graphql-tag';
import { graphql } from '@apollo/client/react/hoc';
import ProductVariationItem from './ProductVariationItem';
import ProductVariationOptionItem from './ProductVariationOptionItem';
import FormNewProductVariation from './FormNewProductVariation';
import FormNewProductVariationOption from './FormNewProductVariationOption';

const ProductVariationList = ({ items, isEditingDisabled, productId }) => (
  <Segment>
    <List celled>
      {items.map(({ options, key, ...item }) => (
        <ProductVariationItem key={item._id} name={key} isEditingDisabled={isEditingDisabled} {...item}>
          {options && (
            <Segment>
              <h3>Options</h3>
              <List celled>
                {options &&
                  options.map(({ ...option }) => (
                    <ProductVariationOptionItem
                      key={option._id}
                      productVariationId={item._id}
                      isEditingDisabled={isEditingDisabled}
                      {...option}
                    />
                  ))}
                {!isEditingDisabled && (
                  <List.Item>
                    <FormNewProductVariationOption
                      productVariationId={item._id}
                      onSuccess={() => true}
                    />
                  </List.Item>
                )}
              </List>
            </Segment>
          )}
        </ProductVariationItem>
      ))}
      {!isEditingDisabled && (
        <List.Item>
          <FormNewProductVariation productId={productId} onSuccess={() => true} />
        </List.Item>
      )}
    </List>
  </Segment>
);

export default compose(
  graphql(gql`
    query productVariations($productId: ID) {
      product(productId: $productId) {
        _id
        status
        ... on ConfigurableProduct {
          variations {
            _id
            type
            key
            texts {
              _id
              title
              subtitle
            }
            options {
              _id
              value
              texts {
                _id
                title
                subtitle
              }
            }
          }
        }
      }
    }
  `),
  graphql(gql`
    mutation addVariation($media: Upload!, $productId: ID!) {
      addProductMedia(media: $media, productId: $productId) {
        _id
        tags
      }
    }
  `),
  mapProps(({ data: { product }, ...rest }) => ({
    items: (product && product.variations) || [],
    isEditingDisabled: !product || product.status === 'DELETED',
    pressDelay: 200,
    ...rest,
  })),
  pure,
)(ProductVariationList);
