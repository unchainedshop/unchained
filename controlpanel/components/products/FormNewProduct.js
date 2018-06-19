import React from 'react';
import { compose, pure, mapProps, withHandlers } from 'recompose';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import AutoField from 'uniforms-semantic/AutoField';
import SubmitField from 'uniforms-semantic/SubmitField';
import ErrorsField from 'uniforms-semantic/ErrorsField';
import AutoForm from 'uniforms-semantic/AutoForm';
import withFormSchema from '../../lib/withFormSchema';
import withFormErrorHandlers from '../../lib/withFormErrorHandlers';

const FormNewProduct = formProps => (
  <AutoForm {...formProps}>
    <AutoField name="title" />
    <AutoField name="type" />
    <ErrorsField />
    <SubmitField value="Add product" className="primary" />
  </AutoForm>
);

export default compose(
  graphql(gql`
    query getProductTypes {
      uniforms: __type(name: "Product") {
        options: possibleTypes {
          value: name
          label: description
        }
      }
    }
  `),
  graphql(gql`
    mutation create($product: CreateProductInput!) {
      createProduct(product: $product) {
        _id
      }
    }
  `),
  withFormSchema(({ data: { uniforms = { options: [] } } = {} }) => ({
    title: {
      type: String,
      optional: false,
      label: 'Titel',
    },
    type: {
      type: String,
      optional: false,
      label: 'Produktart',
      uniforms: {
        options: [{ label: 'Choose Type', value: null }, ...uniforms.options],
      },
    },
  })),
  withHandlers({
    onSubmitSuccess: ({ onSuccess }) => ({ data: { createProduct } }) => {
      onSuccess(createProduct._id);
    },
    onSubmit: ({ mutate, schema }) => ({ ...dirtyInput }) =>
      mutate({
        variables: {
          product: schema.clean(dirtyInput),
        },
      }),
  }),
  withFormErrorHandlers,
  mapProps(({ onSuccess, mutate, ...rest }) => ({
    ...rest,
  })),
  pure,
)(FormNewProduct);
