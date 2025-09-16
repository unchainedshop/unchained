import React from 'react';

const FormContext = React.createContext({
  submitError: '',
  formik: null,
  setSubmitError: () => {},
  disabled: false,
});

export default FormContext;
