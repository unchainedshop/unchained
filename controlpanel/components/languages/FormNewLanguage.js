import React from 'react';
import { compose, pure, mapProps, withHandlers } from 'recompose';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import Router from 'next/router';
import AutoField from 'uniforms-semantic/AutoField';
import SubmitField from 'uniforms-semantic/SubmitField';
import ErrorsField from 'uniforms-semantic/ErrorsField';
import AutoForm from 'uniforms-semantic/AutoForm';
import withFormSchema from '../../lib/withFormSchema';
import withFormErrorHandlers from '../../lib/withFormErrorHandlers';

const FormNewLanguage = formProps => (
  <AutoForm {...formProps} >
    <AutoField name="isoCode" />
    <ErrorsField />
    <SubmitField value="Sprache hinzufügen" className="primary" />
  </AutoForm>
);

export default compose(
  graphql(gql`
    mutation createLanguage($language: CreateLanguageInput!) {
      createLanguage(language: $language) {
        _id
      }
    }
  `, {
    name: 'createLanguage',
    options: {
      refetchQueries: [
        'languages',
      ],
    },
  }),
  withFormSchema({
    isoCode: {
      type: String,
      optional: false,
      label: 'ISO Sprachcode',
    },
  }),
  withHandlers({
    onSubmitSuccess: () => ({ data: { createLanguage } }) => {
      Router.replace({ pathname: '/languages/edit', query: { _id: createLanguage._id } });
    },
    onSubmit: ({ createLanguage, schema }) => ({ ...dirtyInput }) =>
      createLanguage({
        variables: {
          language: schema.clean(dirtyInput),
        },
      }),
  }),
  withFormErrorHandlers,
  mapProps(({ createLanguage, ...rest }) => ({
    ...rest,
  })),
  pure,
)(FormNewLanguage);
