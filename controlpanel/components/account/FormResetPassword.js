import React from 'react';
import { compose, pure, mapProps, withHandlers } from 'recompose';
import { withApollo } from 'react-apollo';
import AutoField from 'uniforms-semantic/AutoField';
import SubmitField from 'uniforms-semantic/SubmitField';
import ErrorsField from 'uniforms-semantic/ErrorsField';
import AutoForm from 'uniforms-semantic/AutoForm';
import { resetPassword } from '../../lib/accounts';
import withFormErrorHandlers from '../../lib/withFormErrorHandlers';
import withFormSchema from '../../lib/withFormSchema';

const FormResetPassword = formProps => (
  <AutoForm {...formProps} >
    <AutoField name="password" type="password" />
    <AutoField name="passwordConfirm" type="password" />
    <ErrorsField />
    <SubmitField value="Passwort ändern" className="primary" />
  </AutoForm>
);

export default compose(
  withApollo,
  withFormSchema({
    password: {
      type: String,
      label: 'Neues Passwort',
    },
    passwordConfirm: {
      type: String,
      label: 'Neues Passwort bestätigen',
      custom() {
        if (this.obj.password !== this.value) {
          return 'mismatch';
        }
        return null;
      },
    },
  }),
  withHandlers({
    onSubmit: ({ client, url: { query: { token } } }) => ({ password: newPassword }) =>
      resetPassword({ newPassword, token }, client),
  }),
  withFormErrorHandlers,
  mapProps(({ client, ...rest }) => ({ ...rest })),
  pure,
)(FormResetPassword);
