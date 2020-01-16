import React from 'react';
import { compose, pure, withProps, withHandlers } from 'recompose';
import { graphql, withApollo } from 'react-apollo';
import gql from 'graphql-tag';
import { Message, Button } from 'semantic-ui-react';
import AutoField from 'uniforms-semantic/AutoField';
import SubmitField from 'uniforms-semantic/SubmitField';
import ErrorsField from 'uniforms-semantic/ErrorsField';
import AutoForm from 'uniforms-semantic/AutoForm';
import { resendVerificationEmail } from '../../lib/accounts';
import withFormSchema from '../../lib/withFormSchema';
import withFormModel from '../../lib/withFormModel';
import withFormErrorHandlers from '../../lib/withFormErrorHandlers';

const FormChangeEmail = ({
  disableResendVerificationEmail,
  mutate,
  client,
  userId,
  resendVerification,
  verified,
  ...formProps
}) => (
  <AutoForm {...formProps}>
    <AutoField name="email" />
    {verified ? (
      <Message positive>
        <Message.Header>E-Mail address verified</Message.Header>
        <p>This E-Mail address has been successfully verified.</p>
      </Message>
    ) : (
      <Message warning visible>
        <Message.Header>
          E-Mail address unverified
          {!disableResendVerificationEmail && (
            <Button
              type="button"
              floated="right"
              basic
              secondary
              onClick={resendVerification}
            >
              Resend verification mail
            </Button>
          )}
        </Message.Header>
        <p>Resend and then check your inbox</p>
      </Message>
    )}
    <ErrorsField />
    <SubmitField value="Change E-Mail address" className="primary" />
  </AutoForm>
);

export default compose(
  withApollo,
  graphql(gql`
    query email($userId: ID) {
      user(userId: $userId) {
        _id
        primaryEmail {
          verified
          address
        }
      }
    }
  `),
  graphql(gql`
    mutation updateEmail($email: String!, $userId: ID) {
      updateEmail(email: $email, userId: $userId) {
        _id
        primaryEmail {
          verified
          address
        }
      }
    }
  `),
  withFormSchema({
    email: {
      type: String,
      label: 'E-Mail'
    }
  }),
  withFormModel(({ data: { user } }) => ({
    email: (user && user.primaryEmail && user.primaryEmail.address) || null
  })),
  withHandlers({
    onSubmit: ({ mutate, schema, userId }) => ({ ...dirtyInput }) =>
      mutate({
        variables: {
          ...schema.clean(dirtyInput),
          userId
        }
      }),
    resendVerification: ({ client, model: { email } }) => () =>
      resendVerificationEmail(
        {
          email
        },
        client
      )
  }),
  withFormErrorHandlers,
  withProps(({ data: { user: { primaryEmail = {} } = {} } }) => ({
    ...primaryEmail
  })),
  pure
)(FormChangeEmail);
