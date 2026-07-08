import React from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { FormikCompatAPI } from '../hooks/useForm';

export interface FormContextValue {
  submitError: string;
  rhf: UseFormReturn<any> | null;
  formik: FormikCompatAPI | null;
  setSubmitError: (error: string) => void;
  disabled: boolean;
}

const FormContext = React.createContext<FormContextValue>({
  submitError: '',
  rhf: null,
  formik: null,
  setSubmitError: () => {},
  disabled: false,
});

export default FormContext;
