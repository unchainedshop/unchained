import clsx from 'clsx';
import { useFormContext as useRHFContext } from 'react-hook-form';

import useFormContext from '../../../modules/forms/hooks/useFormContext';

const SubmitButton = ({
  label,
  disabled: disabledProp = false,
  className = '',
  hidden = false,
  ...props
}) => {
  const { formState } = useRHFContext();
  const { ...restProps } = props;

  const hasError =
    Object.keys(formState.errors).length > 0 &&
    Object.values(formState.errors).some((err: any) => !!err);

  const { disabled: contextDisabled } = useFormContext();

  const disabled =
    disabledProp || contextDisabled || formState.isSubmitting || hasError;

  const isSubmitting = formState.isSubmitting && !hasError;
  const hasErrorOrDisabled =
    (disabledProp || contextDisabled || hasError) && !formState.isSubmitting;
  return (
    <input
      className={clsx(
        'inline-flex cursor-pointer justify-center rounded-sm border border-slate-300 px-4 py-2 text-center text-sm font-medium leading-5 shadow-sm hover:shadow-md focus:ring-focus-ring',
        className,
        {
          'bg-rose-50 dark:bg-slate-800 dark:text-rose-300 cursor-not-allowed border-rose-300 dark:border-rose-600 text-rose-900':
            hasErrorOrDisabled,

          'bg-slate-600 dark:bg-slate-700 text-white cursor-not-allowed border-slate-400 dark:border-slate-600':
            isSubmitting,

          'bg-accent text-text-on-accent hover:bg-accent-hover focus:outline-hidden focus:ring-2 focus:ring-offset-2 border-transparent':
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
