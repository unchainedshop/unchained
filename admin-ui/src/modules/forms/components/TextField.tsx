import classnames from 'classnames';

import { validateMaxLength } from '../lib/validators';
import useField, { FieldHookProps } from '../hooks/useField';
import FieldWrapper from './FieldWrapper';

export interface TextFieldProps extends FieldHookProps {
  autoComplete?: 'on' | 'off';
  type?: 'text' | 'email' | 'password' | 'number';
  maxLength?: number;
  autoFocus?: boolean;
}

const TextField = ({
  maxLength = 0,
  validators = [],
  ...props
}: TextFieldProps) => {
  const field = useField({
    validators: [...validators, maxLength && validateMaxLength(maxLength)],

    ...props,
  });

  return (
    <FieldWrapper {...field}>
      <input
        className={classnames(
          'relative mt-1 block w-full dark:focus:autofill dark:hover:autofill dark:autofill dark:placeholder:text-slate-600 dark:bg-slate-900 dark:text-slate-200 appearance-none rounded-md border-1 dark:border-slate-700 px-4 py-2.5 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-800 shadow-xs',
          {
            'border-rose-700 placeholder:text-rose-500': !!field.error,
            'border-slate-300 placeholder-slate-400': !field.error,
          },
        )}
        disabled={field.disabled}
        id={field.name}
        name={field.name}
        onChange={field.onChange}
        onClick={(e) => {
          e.stopPropagation();
        }}
        onBlur={field.onBlur}
        placeholder={field.placeholder}
        autoComplete={field.autoComplete || 'off'}
        type={field.type || 'text'}
        value={field.value}
        autoFocus={field.autoFocus}
      />
    </FieldWrapper>
  );
};

export default TextField;
