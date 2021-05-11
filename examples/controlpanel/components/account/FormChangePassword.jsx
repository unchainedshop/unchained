import React from 'react';
import AutoField from 'uniforms-semantic/AutoField';
import SubmitField from 'uniforms-semantic/SubmitField';
import ErrorsField from 'uniforms-semantic/ErrorsField';
import AutoForm from 'uniforms-semantic/AutoForm';
import { withApollo } from '@apollo/client/react/hoc';
import { compose, pure, mapProps, withHandlers } from 'recompose';
import { changePassword } from '../../lib/accounts';
import withFormSchema from '../../lib/withFormSchema';
import withFormErrorHandlers from '../../lib/withFormErrorHandlers';

const FormChangePassword = (formProps) => (
  <AutoForm {...formProps}>
    <AutoField name="oldPassword" type="password" />
    <AutoField name="newPassword" type="password" />
    <ErrorsField />
    <SubmitField value="Change password" className="primary" />
  </AutoForm>
);

export default compose(
  withApollo,
  withFormSchema({
    oldPassword: {
      type: String,
      label: 'Current password',
    },
    newPassword: {
      type: String,
      label: 'New password',
    },
  }),
  withHandlers({
    onSubmit:
      ({ client }) =>
      ({ oldPassword, newPassword }) =>
        changePassword({ oldPassword, newPassword }, client),
  }),
  withFormErrorHandlers,
  mapProps(({ client, ...rest }) => ({ ...rest })),
  pure
)(FormChangePassword);
