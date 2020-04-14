import React from 'react';
import { withRouter } from 'next/router';
import { compose, pure, mapProps, withHandlers } from 'recompose';
import { withApollo } from 'react-apollo';
import AutoField from 'uniforms-semantic/AutoField';
import SubmitField from 'uniforms-semantic/SubmitField';
import ErrorsField from 'uniforms-semantic/ErrorsField';
import AutoForm from 'uniforms-semantic/AutoForm';
import { resetPassword } from '../../lib/accounts';
import withFormErrorHandlers from '../../lib/withFormErrorHandlers';
import withFormSchema from '../../lib/withFormSchema';

const FormResetPassword = (formProps) => (
  <AutoForm {...formProps}>
    <AutoField name="password" type="password" />
    <AutoField name="passwordConfirm" type="password" />
    <ErrorsField />
    <SubmitField value="Change password" className="primary" />
  </AutoForm>
);

export default compose(
  withRouter,
  withApollo,
  withFormSchema({
    password: {
      type: String,
      label: 'New password',
    },
    passwordConfirm: {
      type: String,
      label: 'Confirm new password',
      custom() {
        if (this.obj.password !== this.value) { // eslint-disable-line
          return 'mismatch';
        }
        return null;
      },
    },
  }),
  withHandlers({
    onSubmit: ({
      client,
      router: {
        query: { token },
      },
    }) => ({ password: newPassword }) =>
      resetPassword({ newPassword, token, disableHashing: true }, client),
  }),
  withFormErrorHandlers,
  mapProps(({ client, ...rest }) => ({ ...rest })),
  pure
)(FormResetPassword);
