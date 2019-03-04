import React from 'react';
import { toast } from 'react-toastify';
import { compose, mapProps, withHandlers } from 'recompose';
import { Button, Segment, Container, Message } from 'semantic-ui-react';
import { withRouter } from 'next/router';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import AutoField from 'uniforms-semantic/AutoField';
import SubmitField from 'uniforms-semantic/SubmitField';
import ErrorsField from 'uniforms-semantic/ErrorsField';
import AutoForm from 'uniforms-semantic/AutoForm';
import withFormSchema from '../../lib/withFormSchema';
import withFormModel from '../../lib/withFormModel';
import withFormErrorHandlers from '../../lib/withFormErrorHandlers';

const FormEditDeliveryProvider = ({
  configurationError,
  removeDeliveryProvider,
  ...formProps
}) => (
  <Container>
    <AutoForm {...formProps}>
      <Segment attached="bottom">
        <AutoField name={'configuration'} />
        <ErrorsField />
        <SubmitField value="Save" className="primary" />
        {configurationError && (
          <Message negative>
            <Message.Header>
              Configuration Error:
              {configurationError}
            </Message.Header>
            <p>Please check the docs</p>
          </Message>
        )}
        <Button
          type="normal"
          secondary
          floated="right"
          onClick={removeDeliveryProvider}
        >
          Delete
        </Button>
      </Segment>
    </AutoForm>
  </Container>
);

export default compose(
  withRouter,
  graphql(gql`
    query deliveryProvider($deliveryProviderId: ID!) {
      deliveryProvider(deliveryProviderId: $deliveryProviderId) {
        _id
        type
        configuration
        configurationError
      }
    }
  `),
  graphql(
    gql`
      mutation updateDeliveryProvider(
        $deliveryProvider: UpdateProviderInput!
        $deliveryProviderId: ID!
      ) {
        updateDeliveryProvider(
          deliveryProvider: $deliveryProvider
          deliveryProviderId: $deliveryProviderId
        ) {
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
    `,
    {
      name: 'updateDeliveryProvider',
      options: {
        refetchQueries: ['deliveryProvider', 'deliveryProviders']
      }
    }
  ),
  graphql(
    gql`
      mutation removeDeliveryProvider($deliveryProviderId: ID!) {
        removeDeliveryProvider(deliveryProviderId: $deliveryProviderId) {
          _id
        }
      }
    `,
    {
      name: 'removeDeliveryProvider',
      options: {
        refetchQueries: ['deliveryProviders']
      }
    }
  ),
  withFormSchema({
    configuration: {
      type: Array,
      optional: false,
      label: 'Konfigurationsparameter'
    },
    'configuration.$': {
      type: Object
    },
    'configuration.$.key': {
      type: String
    },
    'configuration.$.value': {
      type: String
    }
  }),
  withFormModel(
    ({ data: { deliveryProvider: { ...deliveryProvider } = {} } }) => ({
      ...deliveryProvider
    })
  ),
  withHandlers({
    onSubmitSuccess: () => () => {
      toast('DeliveryProvider saved', { type: toast.TYPE.SUCCESS });
    },
    removeDeliveryProvider: ({
      router,
      removeDeliveryProvider,
      deliveryProviderId
    }) => async event => {
      event.preventDefault();
      router.replace({ pathname: '/delivery-providers' });
      await removeDeliveryProvider({
        variables: {
          deliveryProviderId
        }
      });
    },
    onSubmit: ({ deliveryProviderId, updateDeliveryProvider }) => ({
      configuration
    }) =>
      updateDeliveryProvider({
        variables: {
          deliveryProvider: { configuration },
          deliveryProviderId
        }
      })
  }),
  withFormErrorHandlers,
  mapProps(
    ({
      deliveryProviderId,
      updateDeliveryProvider,
      data: { deliveryProvider: { configurationError } = {} } = {},
      ...rest
    }) => ({
      configurationError,
      ...rest
    })
  )
)(FormEditDeliveryProvider);
