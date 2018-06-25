import React from 'react';
import {
  compose, pure, mapProps, withHandlers,
} from 'recompose';
import { withApollo } from 'react-apollo';
import AutoField from 'uniforms-semantic/AutoField';
import SubmitField from 'uniforms-semantic/SubmitField';
import ErrorsField from 'uniforms-semantic/ErrorsField';
import AutoForm from 'uniforms-semantic/AutoForm';
import { createUser } from '../../lib/accounts';
import withFormSchema from '../../lib/withFormSchema';
import withFormErrorHandlers from '../../lib/withFormErrorHandlers';

const FormSignUp = formProps => (
  <AutoForm {...formProps}>
    <AutoField name="email" type="email" />
    <AutoField name="password" type="password" />
    <ErrorsField />
    <SubmitField value="Registrieren" className="primary" />
  </AutoForm>
);

export default compose(
  withApollo,
  withFormSchema({
    email: {
      type: String,
      label: 'E-Mail Adresse',
    },
    password: {
      type: String,
      label: 'Passwort',
    },
  }),
  withHandlers({
    onSubmit: ({ client }) => ({ email, password }) => createUser({
      email, password, disableHashing: true,
    }, client),
  }),
  withFormErrorHandlers,
  mapProps(({ client, ...rest }) => ({ ...rest })),
  pure,
)(FormSignUp);
