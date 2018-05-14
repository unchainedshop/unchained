import React from 'react';
import AutoField from 'uniforms-semantic/AutoField';
import SubmitField from 'uniforms-semantic/SubmitField';
import ErrorsField from 'uniforms-semantic/ErrorsField';
import AutoForm from 'uniforms-semantic/AutoForm';
import { compose, pure, mapProps, withHandlers } from 'recompose';
import { graphql, withApollo } from 'react-apollo';
import gql from 'graphql-tag';
import withFormSchema from '../../lib/withFormSchema';
import withFormErrorHandlers from '../../lib/withFormErrorHandlers';

const FormSetPassword = ({ resendVerification, isEmailVerified, ...formProps }) => (
  <AutoForm {...formProps} >
    <AutoField name="newPassword" />
    <ErrorsField />
    <SubmitField value="Overwrite password (set)" className="primary" />
  </AutoForm>
);

export default compose(
  withApollo,
  graphql(gql`
    mutation setPassword($newPassword: String!, $userId: ID!) {
      setPassword(newPassword: $newPassword, userId: $userId) {
        _id
      }
    }
  `),
  withFormSchema({
    newPassword: {
      type: String,
      label: 'New password (overwrite)',
    },
  }),
  withHandlers({
    onSubmit: ({ mutate, schema, userId }) => ({ ...dirtyInput }) =>
      mutate({
        variables: {
          ...schema.clean(dirtyInput),
          userId,
        },
      }),
  }),
  withFormErrorHandlers,
  mapProps(({
    mutate,
    client,
    ...rest
  }) =>
    ({ ...rest })),
  pure,
)(FormSetPassword);
