import React from 'react';
import { compose, pure, mapProps, withHandlers } from 'recompose';
import { withApollo } from '@apollo/client/react/hoc';
import AutoField from 'uniforms-semantic/AutoField';
import SubmitField from 'uniforms-semantic/SubmitField';
import ErrorsField from 'uniforms-semantic/ErrorsField';
import AutoForm from 'uniforms-semantic/AutoForm';
import { createUser } from '../../lib/accounts';
import withFormSchema from '../../lib/withFormSchema';
import withFormErrorHandlers from '../../lib/withFormErrorHandlers';

const FormSignUp = (formProps) => (
  <AutoForm {...formProps}>
    <AutoField name="email" type="email" />
    <AutoField name="password" type="password" />
    <ErrorsField />
    <SubmitField value="Signup" className="primary" />
  </AutoForm>
);

export default compose(
  withApollo,
  withFormSchema({
    email: {
      type: String,
      label: 'E-Mail Address',
    },
    password: {
      type: String,
      label: 'Password',
    },
  }),
  withHandlers({
    onSubmit:
      ({ client }) =>
      ({ email, password }) =>
        createUser(
          {
            email,
            password,
            disableHashing: true,
          },
          client
        ),
    onSubmitSuccess: () => (userId) => {
      if (!userId) {
        alert('Signed Up successfully but not logged in automatically'); // eslint-disable-line
      }
    },
  }),
  withFormErrorHandlers,
  mapProps(({ client, ...rest }) => ({ ...rest })),
  pure
)(FormSignUp);
