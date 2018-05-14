import React from 'react';
import { toast } from 'react-toastify';
import { compose, mapProps, withHandlers } from 'recompose';
import { Button, Segment, Container, Message } from 'semantic-ui-react';
import Router from 'next/router';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import AutoField from 'uniforms-semantic/AutoField';
import SubmitField from 'uniforms-semantic/SubmitField';
import ErrorsField from 'uniforms-semantic/ErrorsField';
import AutoForm from 'uniforms-semantic/AutoForm';
import withFormSchema from '../../lib/withFormSchema';
import withFormModel from '../../lib/withFormModel';
import withFormErrorHandlers from '../../lib/withFormErrorHandlers';

const FormEditWarehousingProvider = ({
  configurationError,
  removeWarehousingProvider, ...formProps
}) => (
  <Container>
    <AutoForm {...formProps} >
      <Segment attached="bottom">
        <AutoField name={'configuration'} />
        <ErrorsField />
        <SubmitField value="Save" className="primary" />
        {configurationError && (
          <Message negative>
            <Message.Header>Configuration Error: {configurationError}</Message.Header>
            <p>Please check the docs</p>
          </Message>
        )}
        <Button type="normal" secondary floated="right" onClick={removeWarehousingProvider}>Delete</Button>
      </Segment>
    </AutoForm>
  </Container>
);

export default compose(
  graphql(gql`
    query warehousingProvider($warehousingProviderId: ID!) {
      warehousingProvider(warehousingProviderId: $warehousingProviderId) {
        _id
        type
        configuration
        configurationError
      }
    }
  `),
  graphql(gql`
    mutation updateWarehousingProvider($warehousingProvider: UpdateProviderInput!, $warehousingProviderId: ID!) {
      updateWarehousingProvider(warehousingProvider: $warehousingProvider, warehousingProviderId: $warehousingProviderId) {
        _id
        type
        interface {
          _id
          label
          version
        }
        configuration
        configurationError
      }
    }
  `, {
    name: 'updateWarehousingProvider',
    options: {
      refetchQueries: [
        'warehousingProvider',
        'warehousingProviders',
      ],
    },
  }),
  graphql(gql`
    mutation removeWarehousingProvider($warehousingProviderId: ID!) {
      removeWarehousingProvider(warehousingProviderId: $warehousingProviderId) {
        _id
      }
    }
  `, {
    name: 'removeWarehousingProvider',
    options: {
      refetchQueries: [
        'warehousingProviders',
      ],
    },
  }),
  withFormSchema({
    configuration: {
      type: Array,
      optional: false,
      label: 'Konfigurationsparameter',
    },
    'configuration.$': {
      type: Object,
    },
    'configuration.$.key': {
      type: String,
    },
    'configuration.$.value': {
      type: String,
    },
  }),
  withFormModel(({ data: { warehousingProvider: { ...warehousingProvider } = {} } }) => ({
    ...warehousingProvider,
  })),
  withHandlers({
    onSubmitSuccess: () => () => {
      toast('WarehousingProvider saved', { type: 'success' });
    },
    removeWarehousingProvider: ({
      removeWarehousingProvider,
      warehousingProviderId,
    }) => async (event) => {
      event.preventDefault();
      Router.replace({ pathname: '/warehousing-providers' });
      await removeWarehousingProvider({
        variables: {
          warehousingProviderId,
        },
      });
    },
    onSubmit: ({ warehousingProviderId, updateWarehousingProvider }) =>
      ({ configuration }) => updateWarehousingProvider({
        variables: {
          warehousingProvider: { configuration },
          warehousingProviderId,
        },
      }),
  }),
  withFormErrorHandlers,
  mapProps(({
    warehousingProviderId,
    updateWarehousingProvider,
    data: { warehousingProvider: { configurationError } = {} } = {},
    ...rest
  }) => ({
    configurationError,
    ...rest,
  })),
)(FormEditWarehousingProvider);
