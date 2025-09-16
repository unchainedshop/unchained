import classNames from 'classnames';
import { useFormikContext } from 'formik';

import useFormContext from '../hooks/useFormContext';

const SubmitButton = ({
  label,
  disabled: disabledProp = false,
  className = '',
  hidden = false,
  ...props
}) => {
  const formik = useFormikContext();
  const { ...restProps } = props;

  const fieldsMetaProps = Object.fromEntries(
    Object.keys(formik.initialValues).map((fieldName) => [
      fieldName,
      formik.getFieldMeta(fieldName),
    ]),
  );
  const { disabled: contextDisabled } = useFormContext();

  const hasError = Object.values(fieldsMetaProps).reduce(
    (acc, { error, touched }) => {
      if (acc) return acc;
      return error && touched;
    },
    false,
  );

  const disabled =
    disabledProp || contextDisabled || formik.isSubmitting || hasError;

  const isSubmitting = formik.isSubmitting && !hasError;
  const hasErrorOrDisabled =
    (disabledProp || contextDisabled || hasError) && !formik.isSubmitting;
  return (
    <input
      className={classNames(
        'inline-flex cursor-pointer justify-center rounded-sm border border-slate-300 px-4 py-2 text-center text-sm font-medium leading-5 shadow-sm hover:shadow-md focus:ring-slate-800 dark:focus:ring-slate-400',
        className,
        {
          'bg-rose-50 dark:bg-slate-800 dark:text-rose-300 cursor-not-allowed border-rose-300 dark:border-rose-600 text-rose-900':
            hasErrorOrDisabled,

          'bg-slate-600 dark:bg-slate-700 text-white cursor-not-allowed border-slate-400 dark:border-slate-600':
            isSubmitting,

          'bg-slate-800 dark:bg-slate-600 text-white hover:bg-slate-900 dark:hover:bg-slate-500 focus:outline-hidden focus:ring-2 focus:ring-offset-2 border-transparent':
            !disabled,
          hidden,
        },
      )}
      aria-label={label}
      type="submit"
      value={label}
      disabled={disabled}
      {...restProps}
    />
  );
};

export default SubmitButton;
