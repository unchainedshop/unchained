import React from 'react';
import AutoField from 'uniforms-semantic/AutoField';
import SubmitField from 'uniforms-semantic/SubmitField';
import ErrorsField from 'uniforms-semantic/ErrorsField';
import AutoForm from 'uniforms-semantic/AutoForm';
import { compose, pure, withHandlers } from 'recompose';
import { graphql, withApollo } from 'react-apollo';
import gql from 'graphql-tag';
import withFormSchema from '../../lib/withFormSchema';
import withFormErrorHandlers from '../../lib/withFormErrorHandlers';

const FormSetUsername = ({
  resendVerification,
  verified,
  mutate,
  client,
  userId,
  ...formProps
}) => (
  <AutoForm {...formProps}>
    <AutoField name="username" />
    <ErrorsField />
    <SubmitField value="Set username" className="primary" />
  </AutoForm>
);

export default compose(
  withApollo,
  graphql(gql`
    mutation setUsername($username: String!, $userId: ID!) {
      setUsername(username: $username, userId: $userId) {
        _id
      }
    }
  `),
  withFormSchema({
    username: {
      type: String,
      label: 'New username'
    }
  }),
  withHandlers({
    onSubmit: ({ mutate, schema, userId }) => ({ ...dirtyInput }) =>
      mutate({
        variables: {
          ...schema.clean(dirtyInput),
          userId
        }
      })
  }),
  withFormErrorHandlers,
  pure
)(FormSetUsername);
