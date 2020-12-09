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

const defaultProviderType = 'SHIPPING';

const FormNewDeliveryProvider = ({
  providerType,
  updateProviderType,
  ...formProps
}) => (
  <AutoForm {...formProps}>
    <AutoField name="type" onChange={updateProviderType} />
    {providerType && <AutoField name="adapterKey" />}
    <ErrorsField />
    <SubmitField value="Add Delivery provider" className="primary" />
  </AutoForm>
);

export default compose(
  withRouter,
  withState('providerType', 'updateProviderType', defaultProviderType),
  graphql(gql`
    query getDeliveryProviderType($providerType: DeliveryProviderType!) {
      deliveryProviderType: __type(name: "DeliveryProviderType") {
        options: enumValues {
          value: name
          label: description
        }
      }
      deliveryInterfaces(type: $providerType) {
        _id
        value: _id
        label
      }
    }
  `),
  graphql(
    gql`
      mutation create($deliveryProvider: CreateDeliveryProviderInput!) {
        createDeliveryProvider(deliveryProvider: $deliveryProvider) {
          _id
        }
      }
    `,
    {
      name: 'createDeliveryProvider',
      options: {
        refetchQueries: ['deliveryProviders'],
      },
    }
  ),
  withFormSchema(
    ({
      providerType,
      data: {
        deliveryProviderType = { options: [] },
        deliveryInterfaces = [],
      } = {},
    }) => ({
      type: {
        type: String,
        optional: false,
        label: 'Type',
        defaultValue: providerType,
        uniforms: {
          options: [
            { label: 'Choose Type', value: null },
            ...deliveryProviderType.options,
          ],
        },
      },
      adapterKey: {
        type: String,
        optional: false,
        label: 'Adapter',
        uniforms: {
          options: [
            { label: 'Choose Adapter', value: null },
            ...deliveryInterfaces,
          ],
        },
      },
    })
  ),
  withHandlers({
    onSubmitSuccess: ({ router }) => ({ data: { createDeliveryProvider } }) => {
      router.replace({
        pathname: '/delivery-providers/edit',
        query: { _id: createDeliveryProvider._id },
      });
    },
    onSubmit: ({ createDeliveryProvider, schema }) => ({ ...dirtyInput }) =>
      createDeliveryProvider({
        variables: {
          deliveryProvider: schema.clean(dirtyInput),
        },
      }),
  }),
  withFormErrorHandlers,
  mapProps(({ createDeliveryProvider, ...rest }) => ({
    ...rest,
  }))
)(FormNewDeliveryProvider);
