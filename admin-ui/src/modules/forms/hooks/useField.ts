import { useIntl } from 'react-intl';
import {
  useField as useFormikField,
  FormikHandlers,
  FieldHelperProps,
} from 'formik';

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
  /**
   * A second change handler without the possibility to change the value.
   */
  onChange?: FormikHandlers['handleChange'];
  [key: string]: any;
}

export interface FieldHookProps extends CommonFieldProps {
  validators?: Validator[];
}

export interface ComputedProps extends CommonFieldProps {
  error?: string;
  onChange: FormikHandlers['handleChange'];
  onBlur: FormikHandlers['handleBlur'];
  setValue: FieldHelperProps<any>['setValue'];
  setError: FieldHelperProps<any>['setError'];
  value: string; // | string[]
}

const useField = (props: FieldHookProps): ComputedProps => {
  const intl = useIntl();

  const { formik, ...form }: any = useFormContext();

  const {
    name,
    required,
    errorMessage,
    disabled = form.disabled || formik.isSubmitting,
    // By default, the label is the translated field name
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

        // Do not run validators if field is not required

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

  const [field, meta, helpers] = useFormikField({
    name,
    validate,
  });
  const error = meta.touched && meta.error;

  const onChange = (event) => {
    if (props.onChange) {
      props.onChange(event);
    }
    field.onChange(event);
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
    setValue: helpers.setValue,
    ...helpers,
  };
};

export default useField;
