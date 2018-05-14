import React from 'react';
import { compose, mapProps, withHandlers, withState } from 'recompose';
import gql from 'graphql-tag';
import Router from 'next/router';
import { graphql } from 'react-apollo';
import AutoField from 'uniforms-semantic/AutoField';
import SubmitField from 'uniforms-semantic/SubmitField';
import ErrorsField from 'uniforms-semantic/ErrorsField';
import AutoForm from 'uniforms-semantic/AutoForm';
import withFormSchema from '../../lib/withFormSchema';
import withFormErrorHandlers from '../../lib/withFormErrorHandlers';

const defaultProviderType = 'CARD';

const FormNewPaymentProvider = ({ providerType, updateProviderType, ...formProps }) => (
  <AutoForm {...formProps} >
    <AutoField name="type" onChange={updateProviderType} />
    {providerType && (
      <AutoField name="adapterKey" />
    )}
    <ErrorsField />
    <SubmitField value="Add Payment provider" className="primary" />
  </AutoForm>
);

export default compose(
  withState('providerType', 'updateProviderType', defaultProviderType),
  graphql(gql`
    query getPaymentProviderType($providerType: PaymentProviderType!) {
      paymentProviderType: __type(name: "PaymentProviderType") {
        options: enumValues {
          value: name
          label: description
        }
      }
      paymentInterfaces(type: $providerType) {
        _id
        value: _id
        label
      }
    }
  `),
  graphql(gql`
    mutation create($paymentProvider: CreateProviderInput!) {
      createPaymentProvider(paymentProvider: $paymentProvider) {
        _id
      }
    }
  `, {
    name: 'createPaymentProvider',
    options: {
      refetchQueries: [
        'paymentProviders',
      ],
    },
  }),
  withFormSchema(({
    providerType, data: {
      paymentProviderType = { options: [] },
      paymentInterfaces = [],
    } = {},
  }) => ({
    type: {
      type: String,
      optional: false,
      label: 'Type',
      defaultValue: providerType,
      uniforms: {
        options: [{ label: 'Choose Type', value: null }, ...paymentProviderType.options],
      },
    },
    adapterKey: {
      type: String,
      optional: false,
      label: 'Adapter',
      uniforms: {
        options: [{ label: 'Choose Adapter', value: null }, ...paymentInterfaces],
      },
    },
  })),
  withHandlers({
    onSubmitSuccess: () => ({ data: { createPaymentProvider } }) => {
      Router.replace({ pathname: '/payment-providers/edit', query: { _id: createPaymentProvider._id } });
    },
    onSubmit: ({ createPaymentProvider, schema }) => ({ ...dirtyInput }) =>
      createPaymentProvider({
        variables: {
          paymentProvider: schema.clean(dirtyInput),
        },
      }),
  }),
  withFormErrorHandlers,
  mapProps(({ createPaymentProvider, ...rest }) => ({
    ...rest,
  })),
)(FormNewPaymentProvider);
