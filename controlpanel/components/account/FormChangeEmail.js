import React from 'react';
import { Message, Button } from 'semantic-ui-react';
import AutoField from 'uniforms-semantic/AutoField';
import SubmitField from 'uniforms-semantic/SubmitField';
import ErrorsField from 'uniforms-semantic/ErrorsField';
import AutoForm from 'uniforms-semantic/AutoForm';

const FormChangeEmail = ({
  disableResendVerificationEmail, resendVerification, isEmailVerified, ...formProps
}) => (
  <AutoForm {...formProps} >
    <AutoField name="email" />
    {isEmailVerified ? (
      <Message positive>
        <Message.Header>E-Mail address verified</Message.Header>
        <p>This E-Mail address has been successfully verified.</p>
      </Message>
    ) : (
      <Message warning visible>
        <Message.Header>
          E-Mail address unverified
          {!disableResendVerificationEmail && (
            <Button type="button" floated="right" basic secondary onClick={resendVerification}>
              Resend verification mail
            </Button>
          )}
        </Message.Header>
        <p>Resend and then check your inbox</p>
      </Message>
    )}
    <ErrorsField />
    <SubmitField value="Change E-Mail address" className="primary" />
  </AutoForm>
);

export default FormChangeEmail;
