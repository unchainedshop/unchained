import { compose, pure, mapProps, withHandlers } from 'recompose';
import { graphql, withApollo } from 'react-apollo';
import gql from 'graphql-tag';
import { resendVerificationEmail } from '../../lib/accounts';
import withFormSchema from '../../lib/withFormSchema';
import withFormModel from '../../lib/withFormModel';
import withFormErrorHandlers from '../../lib/withFormErrorHandlers';
import FormChangeEmail from './FormChangeEmail';

export default compose(
  withApollo,
  graphql(gql`
    query email($userId: ID) {
      user(userId: $userId) {
        _id
        email
        isEmailVerified
      }
    }
  `),
  graphql(gql`
    mutation updateEmail($email: String!, $userId: ID) {
      updateEmail(email: $email, userId: $userId) {
        _id
        email
        isEmailVerified
      }
    }
  `),
  withFormSchema({
    email: {
      type: String,
      label: 'E-Mail',
    },
  }),
  withFormModel(({ data: { user } }) => ({
    email: (user && user.email) || null,
  })),
  withHandlers({
    onSubmit: ({ mutate, schema, userId }) => ({ ...dirtyInput }) =>
      mutate({
        variables: {
          ...schema.clean(dirtyInput),
          userId,
        },
      }),
    resendVerification: ({ client, model: { email } }) => () =>
      resendVerificationEmail({ email }, client),

  }),
  withFormErrorHandlers,
  mapProps(({
    mutate,
    client,
    data: { user: { isEmailVerified = false } = {} },
    ...rest
  }) =>
    ({ isEmailVerified, ...rest })),
  pure,
)(FormChangeEmail);
