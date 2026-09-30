import React from 'react';
import sharedContext from '../../common/utils/sharedContext';
import type { UseFormReturn } from 'react-hook-form';
import type { FormAPI } from '../hooks/useForm';

export interface FormContextValue {
  submitError: string;
  rhf: UseFormReturn<any> | null;
  api: FormAPI | null;
  setSubmitError: (error: string) => void;
  disabled: boolean;
}

const FormContext = sharedContext(
  'FormContext',
  React.createContext<FormContextValue>({
    submitError: '',
    rhf: null,
    api: null,
    setSubmitError: () => {},
    disabled: false,
  }),
);

export default FormContext;
