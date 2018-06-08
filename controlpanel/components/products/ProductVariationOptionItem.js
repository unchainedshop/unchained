import React from 'react';
import { compose, withState, withHandlers } from 'recompose';
import { List, Button } from 'semantic-ui-react';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import FormEditProductVariationTexts from './FormEditProductVariationTexts';

const ProductVariationOptionItem = ({
  productVariationId, texts, value, isEditing,
  toggleEditing, isEditingDisabled, removeVariation,
}) => (
  <List.Item>
    <List.Content floated="right">
      {!isEditing && !isEditingDisabled && (
        <Button
          onClick={toggleEditing}
        >
            Bearbeiten
        </Button>
      )}
      {!isEditing && !isEditingDisabled && (
        <Button
          secondary
          onClick={removeVariation}
        >
            Delete
        </Button>
      )}
    </List.Content>
    <List.Content>
      <List.Header>{value}</List.Header>
      <List.Description>{texts && `${texts.title}`}</List.Description>
      {isEditing ? (
        <FormEditProductVariationTexts
          productVariationId={productVariationId}
          productVariationOptionValue={value}
          isEditingDisabled={isEditingDisabled}
          onCancel={toggleEditing}
          onSubmitSuccess={toggleEditing}
        />
      ) : ''}
    </List.Content>
  </List.Item>
);

export default compose(
  graphql(gql`
    mutation removeProductVariationOption($productVariationId: ID!, $productVariationOptionValue: String!) {
      removeProductVariationOption(productVariationId: $productVariationId, productVariationOptionValue: $productVariationOptionValue) {
        _id
      }
    }
  `, {
    name: 'removeProductVariationOption',
    options: {
      refetchQueries: [
        'productVariations',
      ],
    },
  }),
  withState('isEditing', 'setIsEditing', false),
  withHandlers({
    removeVariation: ({ removeProductVariationOption, value, productVariationId }) => async () => {
      await removeProductVariationOption({
        variables: {
          productVariationId,
          productVariationOptionValue: value,
        },
      });
    },
    toggleEditing: ({ isEditing, setIsEditing }) => (event) => {
      if (event && event.preventDefault) event.preventDefault();
      setIsEditing(!isEditing);
    },
  }),
)(ProductVariationOptionItem);
