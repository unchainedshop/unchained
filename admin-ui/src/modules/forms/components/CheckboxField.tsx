import classNames from 'classnames';

import useField, { CommonFieldProps } from '../hooks/useField';

const CheckboxField = (props: CommonFieldProps) => {
  const {
    disabled,
    labelClassName,
    containerClassName,
    inputClassName,
    ...checkboxProps
  } = props;
  const field = useField({ ...props, type: 'checkbox' });
  return (
    <div
      className={classNames(
        '',
        {
          'text-rose-600': !!field.error,
          checkbox: true,
          disabled: field.disabled,
          required: field.required,
        },
        containerClassName,
      )}
    >
      <input
        checked={!!field.value}
        disabled={disabled}
        id={field.name}
        name={field.name}
        onChange={field.onChange}
        onBlur={field.onBlur}
        type="checkbox"
        className={classNames(
          'h-4 w-4 rounded-xs border-slate-300 dark:border-slate-600 bg-white dark:!bg-slate-800 text-indigo-600 dark:text-slate-200 focus:ring-slate-800',
          inputClassName,
          props.className,
        )}
        {...checkboxProps}
      />
      <label
        htmlFor={field.name}
        className={classNames(
          'text-sm text-slate-900 dark:text-slate-200',
          labelClassName,
          {
            'text-danger': !!field.error,
          },
        )}
      >
        {field.label}
      </label>
    </div>
  );
};

export default CheckboxField;
