import React from 'react';
import { compose, pure, withHandlers } from 'recompose';
import { graphql, withApollo } from 'react-apollo';
import gql from 'graphql-tag';
import AutoField from 'uniforms-semantic/AutoField';
import SubmitField from 'uniforms-semantic/SubmitField';
import ErrorsField from 'uniforms-semantic/ErrorsField';
import AutoForm from 'uniforms-semantic/AutoForm';
import withFormSchema from '../../lib/withFormSchema';
import withFormErrorHandlers from '../../lib/withFormErrorHandlers';

const FormChangeEmail = ({
  mutate,
  client,
  userId,
  verified,
  ...formProps
}) => (
  <AutoForm {...formProps}>
    <AutoField name="email" />
    <ErrorsField />
    <SubmitField value="Add E-Mail address" className="primary" />
  </AutoForm>
);

export default compose(
  withApollo,
  graphql(gql`
    mutation addEmail($email: String!, $userId: ID) {
      addEmail(email: $email, userId: $userId) {
        _id
        emails {
          verified
          address
        }
      }
    }
  `),
  withFormSchema({
    email: {
      type: String,
      label: 'E-Mail',
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
  pure
)(FormChangeEmail);
