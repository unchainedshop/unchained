import { useState } from 'react';
import { useFormik, FormikValues, FormikErrors, FormikTouched } from 'formik';
import { useIntl } from 'react-intl';
import { toast } from 'react-toastify';
import clean from '../lib/clean';
import { CombinedGraphQLErrors } from '@apollo/client';

export type OnSubmitSuccessType = (
  result: boolean,

  values: FormikValues,
) => Promise<boolean> | boolean;

export type OnSubmitType = (
  variables: Record<string, any>,
) => Promise<{ success: boolean; data?: any; error?: any }>;

/**
 * @param onSubmitSuccess Return `false` to skip redirect
 */

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
  initialValues: FormikValues;
  initialTouched?: FormikTouched<FormikValues>;
  initialErrors?: FormikErrors<FormikValues>;
  enableReinitialize?: boolean;
  successMessage?: string;
  disabled?: boolean;
  validate?: (
    values: FormikValues,
  ) => void | object | Promise<FormikErrors<FormikValues>>;
}) => {
  const intl = useIntl();
  const [submitError, setSubmitError] = useState('');

  const parseError = (combinedError) => {
    const error = (combinedError as CombinedGraphQLErrors)?.errors?.[0];
    return intl.formatMessage(
      {
        id: 'error_server',
        defaultMessage: '{details}',
      },
      { details: error?.message || '' },
    );
  };

  const onSubmit = async (values) => {
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
        } else {
          reset = false;
          setSubmitError(
            getSubmitErrorMessage(!!errors) || parseError(!!errors),
          );
        }
      }
    } catch (error) {
      reset = false;
      setSubmitError(getSubmitErrorMessage(error) || parseError(error));
    }

    if (reset) {
      setSubmitError('');
    }
  };

  const formik = useFormik({
    initialValues,
    initialErrors,
    initialTouched,
    enableReinitialize,
    onSubmit,
    validate,
  });

  return {
    submitError,
    formik,
    setSubmitError,
    disabled,
  };
};
export default useForm;
