import React from 'react';
import { compose, withState, withHandlers } from 'recompose';
import { Button, List } from 'semantic-ui-react';
import gql from 'graphql-tag';
import { graphql } from '@apollo/client/react/hoc';
import FormEditProductVariationTexts from './FormEditProductVariationTexts';

const ProductVariationItem = ({
  children,
  texts,
  type,
  name,
  _id,
  isEditing,
  toggleEditing,
  isEditingDisabled,
  removeVariation,
}) => (
  <List.Item>
    <List.Content floated="right">
      {!isEditing && !isEditingDisabled && <Button onClick={toggleEditing}>Edit</Button>}
      {!isEditing && !isEditingDisabled && (
        <Button secondary onClick={removeVariation}>
          Delete
        </Button>
      )}
    </List.Content>
    <List.Content>
      <List.Header>
        {name} ({type})
      </List.Header>
      <List.Description>{texts && `${texts.title}`}</List.Description>
      {isEditing ? (
        <FormEditProductVariationTexts
          productVariationId={_id}
          isEditingDisabled={isEditingDisabled}
          onCancel={toggleEditing}
          onSubmitSuccess={toggleEditing}
        />
      ) : (
        children
      )}
    </List.Content>
  </List.Item>
);

export default compose(
  graphql(
    gql`
      mutation removeProductVariation($productVariationId: ID!) {
        removeProductVariation(productVariationId: $productVariationId) {
          _id
        }
      }
    `,
    {
      name: 'removeProductVariation',
      options: {
        refetchQueries: ['productVariations'],
      },
    },
  ),
  withState('isEditing', 'setIsEditing', false),
  withHandlers({
    removeVariation:
      ({ removeProductVariation, _id }) =>
      async () => {
        await removeProductVariation({
          variables: {
            productVariationId: _id,
          },
        });
      },
    toggleEditing:
      ({ isEditing, setIsEditing }) =>
      (event) => {
        if (event && event.preventDefault) event.preventDefault();
        setIsEditing(!isEditing);
      },
  }),
)(ProductVariationItem);
