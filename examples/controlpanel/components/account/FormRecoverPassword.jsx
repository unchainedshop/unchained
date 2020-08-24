import React from 'react';
import { withApollo } from '@apollo/client/react/hoc';
import { compose, pure, mapProps, withHandlers } from 'recompose';
import AutoField from 'uniforms-semantic/AutoField';
import SubmitField from 'uniforms-semantic/SubmitField';
import ErrorsField from 'uniforms-semantic/ErrorsField';
import AutoForm from 'uniforms-semantic/AutoForm';
import { forgotPassword } from '../../lib/accounts';
import withFormSchema from '../../lib/withFormSchema';
import withFormErrorHandlers from '../../lib/withFormErrorHandlers';

const FormRecoverPassword = (formProps) => (
  <AutoForm {...formProps}>
    <AutoField name="email" />
    <ErrorsField />
    <SubmitField value="Password zurücksetzen" className="primary" />
  </AutoForm>
);

export default compose(
  withApollo,
  withFormSchema({
    email: {
      type: String,
      label: 'E-Mail Adresse',
    },
  }),
  withHandlers({
    onSubmit: ({ client }) => ({ email }) => forgotPassword({ email }, client),
  }),
  withFormErrorHandlers,
  mapProps(({ client, ...rest }) => ({ ...rest })),
  pure
)(FormRecoverPassword);
