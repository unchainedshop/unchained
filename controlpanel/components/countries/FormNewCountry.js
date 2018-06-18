import React from 'react';
import { compose, mapProps, withHandlers } from 'recompose';
import gql from 'graphql-tag';
import { withRouter } from 'next/router';
import { graphql } from 'react-apollo';
import AutoField from 'uniforms-semantic/AutoField';
import SubmitField from 'uniforms-semantic/SubmitField';
import ErrorsField from 'uniforms-semantic/ErrorsField';
import AutoForm from 'uniforms-semantic/AutoForm';
import withFormSchema from '../../lib/withFormSchema';
import withFormErrorHandlers from '../../lib/withFormErrorHandlers';

const FormNewCountry = formProps => (
  <AutoForm {...formProps} >
    <AutoField name="isoCode" />
    <ErrorsField />
    <SubmitField value="Land hinzufügen" className="primary" />
  </AutoForm>
);

export default compose(
  withRouter,
  graphql(gql`
    mutation create($country: CreateCountryInput!) {
      createCountry(country: $country) {
        _id
      }
    }
  `, {
    name: 'createCountry',
    options: {
      refetchQueries: [
        'countries',
      ],
    },
  }),
  withFormSchema({
    isoCode: {
      type: String,
      optional: false,
      label: 'ISO Ländercode',
    },
  }),
  withHandlers({
    onSubmitSuccess: ({ router }) => ({ data: { createCountry } }) => {
      router.replace({ pathname: '/countries/edit', query: { _id: createCountry._id } });
    },
    onSubmit: ({ createCountry, schema }) => ({ ...dirtyInput }) =>
      createCountry({
        variables: {
          country: schema.clean(dirtyInput),
        },
      }),
  }),
  withFormErrorHandlers,
  mapProps(({ createCountry, ...rest }) => ({
    ...rest,
  })),
)(FormNewCountry);
