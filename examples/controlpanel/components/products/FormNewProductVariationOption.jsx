import React from 'react';
import { compose, pure, mapProps, withHandlers } from 'recompose';
import { Form } from 'semantic-ui-react';
import gql from 'graphql-tag';
import { graphql } from '@apollo/client/react/hoc';
import AutoField from 'uniforms-semantic/AutoField';
import SubmitField from 'uniforms-semantic/SubmitField';
import ErrorsField from 'uniforms-semantic/ErrorsField';
import AutoForm from 'uniforms-semantic/AutoForm';
import withFormSchema from '../../lib/withFormSchema';
import withFormErrorHandlers from '../../lib/withFormErrorHandlers';

const FormNewProductVariationOption = (formProps) => (
  <AutoForm {...formProps}>
    <Form.Group inline>
      <AutoField name="title" />
      <AutoField name="value" />
    </Form.Group>
    <ErrorsField />
    <SubmitField value="Add option" className="primary" />
  </AutoForm>
);

export default compose(
  graphql(
    gql`
      mutation create($option: CreateProductVariationOptionInput!, $productVariationId: ID!) {
        createProductVariationOption(option: $option, productVariationId: $productVariationId) {
          _id
        }
      }
    `,
    {
      options: {
        refetchQueries: ['productVariations'],
      },
    },
  ),
  withFormSchema(() => ({
    title: {
      type: String,
      optional: false,
    },
    value: {
      type: String,
      optional: false,
    },
  })),
  withHandlers({
    onSubmitSuccess:
      ({ onSuccess }) =>
      ({ data: { createProductVariationOption } }) =>
        onSuccess(createProductVariationOption._id),
    onSubmit:
      ({ mutate, schema, productVariationId }) =>
      ({ ...dirtyInput }) =>
        mutate({
          variables: {
            option: schema.clean(dirtyInput),
            productVariationId,
          },
        }),
  }),
  withFormErrorHandlers,
  mapProps(({ onSuccess, productVariationId, mutate, ...rest }) => ({
    ...rest,
  })),
  pure,
)(FormNewProductVariationOption);
