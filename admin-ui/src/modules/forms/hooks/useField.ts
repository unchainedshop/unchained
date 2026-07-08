import { useRef } from 'react';
import { useIntl } from 'react-intl';
import { useController } from 'react-hook-form';

import { Validator, validateRequired } from '../lib/validators';
import useFormContext from './useFormContext';

export interface CommonFieldProps {
  name?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  value?: string;
  autoComplete?: 'on' | 'off';
  label?: string;
  errorMessage?: string;
  help?: string;
  className?: string;
  labelClassName?: string;
  containerClassName?: string;
  inputClassName?: string;
  placeholder?: string;
  hideLabel?: boolean;
  onChange?: (event: any) => void;
  [key: string]: any;
}

export interface FieldHookProps extends CommonFieldProps {
  validators?: Validator[];
}

export interface ComputedProps extends CommonFieldProps {
  error?: string;
  onChange: (event: any) => void;
  onBlur: () => void;
  setValue: (value: any, options?: any) => void;
  setError: (message: string) => void;
  setTouched: (touched: boolean) => void;
  value: string;
}

const useField = (props: FieldHookProps): ComputedProps => {
  const intl = useIntl();

  const { rhf, ...form }: any = useFormContext();

  const {
    name,
    required,
    errorMessage,
    disabled = form.disabled || rhf?.formState?.isSubmitting,
    label = intl.formatMessage({
      id: name,
      defaultMessage: 'default_input_name',
      description:
        "DO not translate Skip this as it's the default given label when a component is not provided explicit label",
    }),
    validators = [],
  } = props;

  const combinedValidators = [
    ...validators,
    required && validateRequired,
  ].filter(Boolean);

  const validate = (value) => {
    return combinedValidators.reduce(
      (acc: string, { isValid, intlMessageDescriptor, intlMessageValues }) => {
        if (acc) return acc;

        if (!isValid(value))
          return (
            errorMessage ||
            intl.formatMessage(intlMessageDescriptor, {
              label,
              ...intlMessageValues,
            })
          );
        return acc;
      },
      '',
    );
  };

  const validateRef = useRef(validate);
  validateRef.current = validate;

  const { field, fieldState, formState } = useController({
    name,
    control: rhf?.control,
    rules: {
      validate: (value) => {
        const error = validateRef.current(value);
        return error || true;
      },
    },
  });

  const error =
    (fieldState.isTouched || formState.isSubmitted) &&
    fieldState.error?.message;

  const onChange = (event) => {
    if (props.onChange) {
      props.onChange(event);
    }
    if (props.type === 'number') {
      const raw = event?.target?.value;
      const num = raw === '' || raw == null ? null : Number(raw);
      field.onChange(num);
    } else {
      field.onChange(event);
    }
  };

  const isNullOrUndefined = (v) => {
    return v === null || v === undefined;
  };

  return {
    ...props,
    name,
    error,
    label,
    disabled,
    required,
    onChange,
    onBlur: field.onBlur,
    value: isNullOrUndefined(field.value) ? '' : field.value,
    setValue: (value: any, shouldValidate?: boolean) => {
      rhf?.setValue(name, value, {
        shouldDirty: true,
        shouldValidate: shouldValidate ?? false,
      });
    },
    setError: (message: string) => {
      if (message) {
        rhf?.setError(name, { type: 'manual', message });
      } else {
        rhf?.clearErrors(name);
      }
    },
    setTouched: (touched: boolean) => {
      if (touched) {
        rhf?.trigger(name);
      }
    },
  };
};

export default useField;
