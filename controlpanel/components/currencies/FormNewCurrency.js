import React from 'react';
import Router from 'next/router';
import { compose, mapProps, withHandlers } from 'recompose';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import AutoField from 'uniforms-semantic/AutoField';
import SubmitField from 'uniforms-semantic/SubmitField';
import ErrorsField from 'uniforms-semantic/ErrorsField';
import AutoForm from 'uniforms-semantic/AutoForm';
import withFormSchema from '../../lib/withFormSchema';
import withFormErrorHandlers from '../../lib/withFormErrorHandlers';

const FormNewCurrency = formProps => (
  <AutoForm {...formProps} >
    <AutoField name="isoCode" />
    <ErrorsField />
    <SubmitField value="Währung hinzufügen" className="primary" />
  </AutoForm>
);

export default compose(
  graphql(gql`
    mutation createCurrency($currency: CreateCurrencyInput!) {
      createCurrency(currency: $currency) {
        _id
      }
    }
  `, {
    name: 'createCurrency',
    options: {
      refetchQueries: [
        'currencies',
      ],
    },
  }),
  withFormSchema({
    isoCode: {
      type: String,
      optional: false,
      label: 'ISO Währungscode',
    },
  }),
  withHandlers({
    onSubmitSuccess: () => ({ data: { createCurrency } }) => {
      Router.replace({ pathname: '/currencies/edit', query: { _id: createCurrency._id } });
    },
    onSubmit: ({ createCurrency, schema }) => ({ ...dirtyInput }) =>
      createCurrency({
        variables: {
          currency: schema.clean(dirtyInput),
        },
      }),
  }),
  withFormErrorHandlers,
  mapProps(({ createCurrency, ...rest }) => ({
    ...rest,
  })),
)(FormNewCurrency);
