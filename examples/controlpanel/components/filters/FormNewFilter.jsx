import React from 'react';
import { compose, pure, mapProps, withHandlers } from 'recompose';
import gql from 'graphql-tag';
import { graphql } from '@apollo/client/react/hoc';
import AutoField from 'uniforms-semantic/AutoField';
import SubmitField from 'uniforms-semantic/SubmitField';
import ErrorsField from 'uniforms-semantic/ErrorsField';
import AutoForm from 'uniforms-semantic/AutoForm';
import withFormSchema from '../../lib/withFormSchema';
import withFormErrorHandlers from '../../lib/withFormErrorHandlers';

const FormNewFilter = (formProps) => (
  <AutoForm {...formProps}>
    <AutoField name="title" />
    <AutoField name="key" />
    <AutoField name="type" />
    <ErrorsField />
    <SubmitField value="Add filter" className="primary" />
  </AutoForm>
);

export default compose(
  graphql(gql`
    query getFilterTypes {
      uniforms: __type(name: "FilterType") {
        options: enumValues {
          value: name
          label: description
        }
      }
    }
  `),
  graphql(gql`
    mutation create($filter: CreateFilterInput!) {
      createFilter(filter: $filter) {
        _id
      }
    }
  `),
  withFormSchema(({ data: { uniforms = { options: [] } } = {} }) => ({
    title: {
      type: String,
      optional: false,
      label: 'Name',
    },
    key: {
      type: String,
      optional: false,
      label: 'Key',
    },
    type: {
      type: String,
      optional: false,
      label: 'Type',
      uniforms: {
        options: [{ label: 'Choose Type', value: null }, ...uniforms.options],
      },
    },
  })),
  withHandlers({
    onSubmitSuccess:
      ({ onSuccess }) =>
      ({ data: { createFilter } }) => {
        onSuccess(createFilter._id);
      },
    onSubmit:
      ({ mutate, schema }) =>
      ({ ...dirtyInput }) =>
        mutate({
          variables: {
            filter: schema.clean(dirtyInput),
          },
        }),
  }),
  withFormErrorHandlers,
  mapProps(({ onSuccess, mutate, ...rest }) => ({
    ...rest,
  })),
  pure,
)(FormNewFilter);
