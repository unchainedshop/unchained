import { FormProvider } from 'react-hook-form';

import FormContext from '../lib/FormContext';

const Form = ({ form, children, className = '', ...props }) => {
  return (
    <FormContext.Provider value={form}>
      <FormProvider {...form.rhf}>
        <form
          onReset={() => form.formik.handleReset()}
          onSubmit={form.formik.handleSubmit}
          method="POST"
          className={className}
          {...props}
        >
          {children}
        </form>
      </FormProvider>
    </FormContext.Provider>
  );
};

export default Form;
