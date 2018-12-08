import React from 'react';
import {
  compose, pure, mapProps, withHandlers,
} from 'recompose';
import { Form } from 'semantic-ui-react';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import AutoField from 'uniforms-semantic/AutoField';
import SubmitField from 'uniforms-semantic/SubmitField';
import ErrorsField from 'uniforms-semantic/ErrorsField';
import AutoForm from 'uniforms-semantic/AutoForm';
import withFormSchema from '../../lib/withFormSchema';
import withFormErrorHandlers from '../../lib/withFormErrorHandlers';

const FormNewFilterOption = formProps => (
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
  graphql(gql`
    mutation createFilterOption($option: CreateFilterOptionInput!, $filterId: ID!) {
      createFilterOption(option: $option, filterId: $filterId) {
        _id
      }
    }
  `, {
    options: {
      refetchQueries: [
        'filterOptions',
      ],
    },
  }),
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
    onSubmitSuccess: ({
      onSuccess,
    }) => ({
      data: { createFilterOption },
    }) => onSuccess(createFilterOption._id),
    onSubmit: ({ mutate, schema, filterId }) => ({ ...dirtyInput }) => mutate({
      variables: {
        option: schema.clean(dirtyInput),
        filterId,
      },
    }),
  }),
  withFormErrorHandlers,
  mapProps(({
    onSuccess, filterId, mutate, ...rest
  }) => ({
    ...rest,
  })),
  pure,
)(FormNewFilterOption);
