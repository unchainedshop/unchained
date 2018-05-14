import React from 'react';
import AutoField from 'uniforms-semantic/AutoField';
import SubmitField from 'uniforms-semantic/SubmitField';
import ErrorsField from 'uniforms-semantic/ErrorsField';
import AutoForm from 'uniforms-semantic/AutoForm';

const FormSignUp = formProps => (
  <AutoForm {...formProps} >
    <AutoField name="email" type="email" />
    <AutoField name="password" type="password" />
    <ErrorsField />
    <SubmitField value="Registrieren" className="primary" />
  </AutoForm>
);


export default FormSignUp;
