import { useState, useCallback, useMemo } from 'react';
import { useForm as useRHF } from 'react-hook-form';
import { useIntl } from 'react-intl';
import { toast } from 'react-toastify';
import clean from '../lib/clean';
import { CombinedGraphQLErrors } from '@apollo/client';

export type OnSubmitSuccessType = (
  result: boolean,
  values: Record<string, any>,
) => Promise<boolean> | boolean;

export type OnSubmitType = (
  variables: Record<string, any>,
) => Promise<{ success: boolean; data?: any; error?: any }>;

// Convert react-hook-form's error tree ({ type, message, ref } leaves) into
// Formik's shape: same nesting, but message strings at the leaves and no refs.
const stripToMessages = (errors: any) => {
  if (!errors || typeof errors !== 'object') return errors;
  if (typeof errors.message === 'string' && errors.message)
    return errors.message;
  if (Array.isArray(errors)) return errors.map((v) => stripToMessages(v));
  return Object.fromEntries(
    Object.entries(errors)
      .filter(([k]) => k !== 'ref')
      .map(([k, v]) => [k, stripToMessages(v)]),
  );
};

export interface FormikCompatAPI {
  setFieldError: (name: string, message: string) => void;
  setFieldValue: (name: string, value: any) => void;
  setValues: (values: Record<string, any>) => void;
  values: Record<string, any>;
  isValid: boolean;
  isSubmitting: boolean;
  handleSubmit: (e?: React.BaseSyntheticEvent) => void;
  handleReset: (e?: React.BaseSyntheticEvent) => void;
  resetForm: (nextValues?: Record<string, any>) => void;
  submitForm: () => void;
  getFieldMeta: (name: string) => {
    error: string | undefined;
    touched: boolean;
  };
  initialValues: Record<string, any>;
  errors: Record<string, any>;
}

const useForm = ({
  submit,
  getSubmitErrorMessage = () => '',
  onSubmitSuccess = () => true,
  initialValues,
  initialErrors,
  initialTouched,
  successMessage,
  enableReinitialize,
  validate,
  disabled = false,
}: {
  submit: OnSubmitType;
  getSubmitErrorMessage?: (error?: Error | any) => string;
  onSubmitSuccess?: OnSubmitSuccessType;
  initialValues: Record<string, any>;
  initialTouched?: Record<string, boolean>;
  initialErrors?: Record<string, string>;
  enableReinitialize?: boolean;
  successMessage?: string;
  disabled?: boolean;
  validate?: (
    values: Record<string, any>,
  ) => void | object | Promise<Record<string, string>>;
}) => {
  const intl = useIntl();
  const [submitError, setSubmitError] = useState('');

  const rhf = useRHF({
    // Formik validated on change and blur; 'all' matches that and keeps
    // formState.isValid up to date for consumers like LogInForm.
    mode: 'all',
    defaultValues: initialValues,
    values: enableReinitialize ? initialValues : undefined,
    errors: initialErrors
      ? Object.fromEntries(
          Object.entries(initialErrors).map(([key, message]) => [
            key,
            { type: 'manual', message },
          ]),
        )
      : undefined,
  });

  const parseError = useCallback(
    (combinedError) => {
      const error = (combinedError as CombinedGraphQLErrors)?.errors?.[0];
      return intl.formatMessage(
        {
          id: 'error_server',
          defaultMessage: '{details}',
        },
        { details: error?.message || '' },
      );
    },
    [intl],
  );

  const onSubmit = useCallback(
    async (values) => {
      let reset = true;
      try {
        const result = await submit(clean(values));

        const success =
          (typeof result === 'boolean' ? result : result?.success) ??
          !result?.error;
        if (success) {
          if (successMessage) toast.success(successMessage);
          await onSubmitSuccess(success, result?.data || values);
        } else {
          const errors = typeof result === 'boolean' ? !result : result?.error;

          if (Array.isArray(errors)) {
            errors.forEach((error) => {
              reset = false;
              setSubmitError(getSubmitErrorMessage(error) || parseError(error));
            });
          } else if (typeof errors === 'string') {
            reset = false;
            setSubmitError(getSubmitErrorMessage(errors) || parseError(errors));
          } else if (typeof errors === 'object' && errors !== null) {
            reset = false;
            setSubmitError(getSubmitErrorMessage(errors) || parseError(errors));
          } else {
            reset = false;
            setSubmitError(getSubmitErrorMessage(errors) || parseError(errors));
          }
        }
      } catch (error) {
        reset = false;
        setSubmitError(getSubmitErrorMessage(error) || parseError(error));
      }

      if (reset) {
        setSubmitError('');
      }
    },
    [
      submit,
      successMessage,
      onSubmitSuccess,
      getSubmitErrorMessage,
      parseError,
    ],
  );

  const formik: FormikCompatAPI = useMemo(
    () => ({
      setFieldError: (name: string, message: string) => {
        rhf.setError(name, { type: 'manual', message });
      },
      setFieldValue: (name: string, value: any) => {
        rhf.setValue(name, value, { shouldDirty: true, shouldTouch: true });
      },
      setValues: (values: Record<string, any>) => {
        rhf.reset(values, { keepDirtyValues: false, keepErrors: false });
      },
      get values() {
        return rhf.getValues();
      },
      get isValid() {
        return rhf.formState.isValid;
      },
      get isSubmitting() {
        return rhf.formState.isSubmitting;
      },
      handleSubmit: rhf.handleSubmit(onSubmit),
      handleReset: () => {
        rhf.reset();
      },
      resetForm: (nextValues?: Record<string, any>) => {
        rhf.reset(nextValues || initialValues);
      },
      submitForm: () => {
        rhf.handleSubmit(onSubmit)();
      },
      getFieldMeta: (name: string) => {
        const fieldState = rhf.getFieldState(name, rhf.formState);
        return {
          error: fieldState.error?.message,
          touched: fieldState.isTouched,
        };
      },
      get initialValues() {
        return initialValues;
      },
      get errors() {
        return stripToMessages(rhf.formState.errors);
      },
    }),
    [rhf, onSubmit, initialValues],
  );

  return {
    submitError,
    formik,
    rhf,
    setSubmitError,
    disabled,
  };
};
export default useForm;
