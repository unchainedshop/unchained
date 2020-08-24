import React from 'react';
import { toast } from 'react-toastify';
import { compose, mapProps, withHandlers } from 'recompose';
import { Button, Segment, Container, Message } from 'semantic-ui-react';
import { withRouter } from 'next/router';
import gql from 'graphql-tag';
import { graphql } from '@apollo/client/react/hoc';
import AutoField from 'uniforms-semantic/AutoField';
import SubmitField from 'uniforms-semantic/SubmitField';
import ErrorsField from 'uniforms-semantic/ErrorsField';
import AutoForm from 'uniforms-semantic/AutoForm';
import withFormSchema from '../../lib/withFormSchema';
import withFormModel from '../../lib/withFormModel';
import withFormErrorHandlers from '../../lib/withFormErrorHandlers';

const FormEditPaymentProvider = ({
  configurationError,
  removePaymentProvider,
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
          onClick={removePaymentProvider}
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
    query paymentProvider($paymentProviderId: ID!) {
      paymentProvider(paymentProviderId: $paymentProviderId) {
        _id
        type
        configuration
        configurationError
      }
    }
  `),
  graphql(
    gql`
      mutation updatePaymentProvider(
        $paymentProvider: UpdateProviderInput!
        $paymentProviderId: ID!
      ) {
        updatePaymentProvider(
          paymentProvider: $paymentProvider
          paymentProviderId: $paymentProviderId
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
      name: 'updatePaymentProvider',
      options: {
        refetchQueries: ['paymentProvider', 'paymentProviders'],
      },
    }
  ),
  graphql(
    gql`
      mutation removePaymentProvider($paymentProviderId: ID!) {
        removePaymentProvider(paymentProviderId: $paymentProviderId) {
          _id
        }
      }
    `,
    {
      name: 'removePaymentProvider',
      options: {
        refetchQueries: ['paymentProviders'],
      },
    }
  ),
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
  withFormModel(
    ({ data: { paymentProvider: { ...paymentProvider } = {} } }) => ({
      ...paymentProvider,
    })
  ),
  withHandlers({
    onSubmitSuccess: () => () => {
      toast('PaymentProvider saved', { type: toast.TYPE.SUCCESS });
    },
    removePaymentProvider: ({
      router,
      removePaymentProvider,
      paymentProviderId,
    }) => async (event) => {
      event.preventDefault();
      router.replace({ pathname: '/payment-providers' });
      await removePaymentProvider({
        variables: {
          paymentProviderId,
        },
      });
    },
    onSubmit: ({ paymentProviderId, updatePaymentProvider }) => ({
      configuration,
    }) =>
      updatePaymentProvider({
        variables: {
          paymentProvider: { configuration },
          paymentProviderId,
        },
      }),
  }),
  withFormErrorHandlers,
  mapProps(
    ({
      paymentProviderId,
      updatePaymentProvider,
      data: { paymentProvider: { configurationError } = {} } = {},
      ...rest
    }) => ({
      configurationError,
      ...rest,
    })
  )
)(FormEditPaymentProvider);
