import React from 'react';
import AutoField from 'uniforms-semantic/AutoField';
import SubmitField from 'uniforms-semantic/SubmitField';
import ErrorsField from 'uniforms-semantic/ErrorsField';
import AutoForm from 'uniforms-semantic/AutoForm';

const FormSignIn = ({
  loginType, changeLoginType, ...formProps
}) => (
  <div>
    <AutoForm {...formProps} >
      <AutoField id="email" name="email" />
      <AutoField name="password" type="password" />
      <ErrorsField />
      <SubmitField value="Anmelden" className="primary" />
    </AutoForm>
  </div>
);


export default FormSignIn;
