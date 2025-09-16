import { FormikProvider } from 'formik';

import FormContext from '../lib/FormContext';

const Form = ({ form, children, className = '', ...props }) => {
  return (
    <FormContext.Provider value={form}>
      <FormikProvider value={form.formik}>
        <form
          onReset={form.formik.handleReset}
          onSubmit={form.formik.handleSubmit}
          method="POST"
          className={className}
          {...props}
        >
          {children}
        </form>
      </FormikProvider>
    </FormContext.Provider>
  );
};

export default Form;
