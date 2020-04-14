import React from 'react';
import { compose, pure, mapProps, withHandlers } from 'recompose';
import { Form } from 'semantic-ui-react';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import AutoField from 'uniforms-semantic/AutoField';
import SubmitField from 'uniforms-semantic/SubmitField';
import ErrorsField from 'uniforms-semantic/ErrorsField';
import AutoForm from 'uniforms-semantic/AutoForm';
import withFormSchema from '../../lib/withFormSchema';
import withFormErrorHandlers from '../../lib/withFormErrorHandlers';

const FormNewProductVariation = (formProps) => (
  <AutoForm {...formProps}>
    <Form.Group inline>
      <AutoField name="title" />
      <AutoField name="key" />
      <AutoField name="type" />
    </Form.Group>
    <ErrorsField />
    <SubmitField value="Add variation metric" className="primary" />
  </AutoForm>
);

export default compose(
  graphql(gql`
    query getProductTypes {
      uniforms: __type(name: "ProductVariationType") {
        options: enumValues {
          value: name
          label: description
        }
      }
    }
  `),
  graphql(
    gql`
      mutation create(
        $variation: CreateProductVariationInput!
        $productId: ID!
      ) {
        createProductVariation(variation: $variation, productId: $productId) {
          _id
        }
      }
    `,
    {
      options: {
        refetchQueries: ['productVariations'],
      },
    }
  ),
  withFormSchema(({ data: { uniforms = { options: [] } } = {} }) => ({
    title: {
      type: String,
      optional: false,
    },
    key: {
      type: String,
      optional: false,
    },
    type: {
      type: String,
      optional: false,
      uniforms: {
        options: [{ label: 'Choose Type', value: null }, ...uniforms.options],
      },
    },
  })),
  withHandlers({
    onSubmitSuccess: ({ onSuccess }) => ({
      data: { createProductVariation },
    }) => onSuccess(createProductVariation._id),
    onSubmit: ({ mutate, schema, productId }) => ({ ...dirtyInput }) =>
      mutate({
        variables: {
          variation: schema.clean(dirtyInput),
          productId,
        },
      }),
  }),
  withFormErrorHandlers,
  mapProps(({ onSuccess, productId, mutate, ...rest }) => ({
    ...rest,
  })),
  pure
)(FormNewProductVariation);
