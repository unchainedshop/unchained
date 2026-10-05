import clsx from 'clsx';

import { validateMaxLength } from '../../../modules/forms/lib/validators';
import useField, {
  FieldHookProps,
} from '../../../modules/forms/hooks/useField';
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
        className={clsx(
          'relative mt-1 block w-full dark:focus:autofill dark:hover:autofill dark:autofill appearance-none rounded-md border-1 bg-surface-input px-4 py-2.5 text-sm text-text-primary border-border-default placeholder:text-text-muted focus:outline-hidden focus:ring-2 focus:ring-focus-ring shadow-xs',
          {
            'border-rose-700 placeholder:text-rose-500': !!field.error,
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
