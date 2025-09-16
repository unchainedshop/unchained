import classnames from 'classnames';

import { ComputedProps } from '../hooks/useField';

import type { JSX } from 'react';

interface FieldWrapperProps extends ComputedProps {
  children: JSX.Element;
}

const FieldWrapper = ({
  children,
  className,
  error,
  disabled,
  required,
  name,
  label,
  hideLabel,
  labelClassName,
}: FieldWrapperProps) => {
  return (
    <div
      className={classnames(
        'container',
        {
          'is-invalid': !!error,
          disabled,
          required,
        },
        className,
      )}
    >
      <label
        aria-label={label}
        htmlFor={name}
        className={classnames(
          'mb-2 block text-left text-sm font-light text-slate-800 dark:text-slate-200',
          {
            'mt-1 rounded-sm border border-rose-100 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 p-2 pl-4 text-rose-700 dark:text-rose-400':
              !!error,
            'sr-only': hideLabel,
          },
          labelClassName,
        )}
      >
        {error || label}
      </label>
      {children}
    </div>
  );
};

export default FieldWrapper;
