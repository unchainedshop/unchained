import React from 'react';
import { compose, mapProps, withHandlers, withState } from 'recompose';
import gql from 'graphql-tag';
import { withRouter } from 'next/router';
import { graphql } from '@apollo/client/react/hoc';
import AutoField from 'uniforms-semantic/AutoField';
import SubmitField from 'uniforms-semantic/SubmitField';
import ErrorsField from 'uniforms-semantic/ErrorsField';
import AutoForm from 'uniforms-semantic/AutoForm';
import withFormSchema from '../../lib/withFormSchema';
import withFormErrorHandlers from '../../lib/withFormErrorHandlers';
import { WAREHOUSING_PROVIDERS_QUERY } from './WarehousingProviderList';

const defaultProviderType = 'PHYSICAL';

const FormNewWarehousingProvider = ({ providerType, updateProviderType, ...formProps }) => (
  <AutoForm {...formProps}>
    <AutoField name="type" onChange={updateProviderType} />
    {providerType && <AutoField name="adapterKey" />}
    <ErrorsField />
    <SubmitField value="Add warehousing provider" className="primary" />
  </AutoForm>
);

export default compose(
  withRouter,
  withState('providerType', 'updateProviderType', defaultProviderType),
  graphql(gql`
    query getWarehousingProviderType($providerType: WarehousingProviderType!) {
      warehousingProviderType: __type(name: "WarehousingProviderType") {
        options: enumValues {
          value: name
          label: description
        }
      }
      warehousingInterfaces(type: $providerType) {
        _id
        value: _id
        label
      }
    }
  `),
  graphql(
    gql`
      mutation create($warehousingProvider: CreateWarehousingProviderInput!) {
        createWarehousingProvider(warehousingProvider: $warehousingProvider) {
          _id
        }
      }
    `,
    {
      name: 'createWarehousingProvider',
      options: {
        refetchQueries: [{ query: WAREHOUSING_PROVIDERS_QUERY }],
      },
    },
  ),
  withFormSchema(
    ({
      providerType,
      data: { warehousingProviderType = { options: [] }, warehousingInterfaces = [] } = {},
    }) => ({
      type: {
        type: String,
        optional: false,
        label: 'Type',
        defaultValue: providerType,
        uniforms: {
          options: [{ label: 'Choose Type', value: null }, ...warehousingProviderType.options],
        },
      },
      adapterKey: {
        type: String,
        optional: false,
        label: 'Adapter',
        uniforms: {
          options: [{ label: 'Choose Adapter', value: null }, ...warehousingInterfaces],
        },
      },
    }),
  ),
  withHandlers({
    onSubmitSuccess:
      ({ router }) =>
      ({ data: { createWarehousingProvider } }) => {
        router.replace({
          pathname: '/warehousing-providers/edit',
          query: { _id: createWarehousingProvider._id },
        });
      },
    onSubmit:
      ({ createWarehousingProvider, schema }) =>
      ({ ...dirtyInput }) =>
        createWarehousingProvider({
          variables: {
            warehousingProvider: schema.clean(dirtyInput),
          },
        }),
  }),
  withFormErrorHandlers,
  mapProps(({ createWarehousingProvider, ...rest }) => ({
    ...rest,
  })),
)(FormNewWarehousingProvider);
