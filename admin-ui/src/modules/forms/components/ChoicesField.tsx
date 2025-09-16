import classNames from 'classnames';

import useField, { FieldHookProps } from '../hooks/useField';
import { SelectFieldOptions } from './SelectField';

interface ChoicesFieldProps extends FieldHookProps {
  multiple?: boolean;
  options: SelectFieldOptions;
  choiceClassName?: string;
  choiceContainerClassName?: string;
  labelClassName?: string;
}

const ChoicesField = ({ multiple, options, ...props }: ChoicesFieldProps) => {
  const field = useField({ multiple, options, ...props });
  const {
    choiceClassName = "col-md-6 col-lg-4'",
    choiceContainerClassName = '',
    labelClassName = '',
    inputClassName = '',
  } = props;

  const mappableValue =
    typeof field.value === 'string' ? [field.value] : field.value;
  const { className, hideLabel } = props;
  return (
    <div
      className={classNames('container', className, {
        'is-invalid': !!field.error,
        disabled: field.disabled,
        required: field.required,
      })}
    >
      <label
        className={classNames('text-sm', className, {
          'text-rose-600': !!field.error,
          'sr-only': hideLabel,
        })}
      >
        {field.label}
      </label>

      <div
        className={classNames(
          `row flex flex-row gap-3 ${choiceContainerClassName}`,
          className,
        )}
      >
        {Object.entries(field.options).map(([value, display]: any) => (
          <div
            className={classNames(`-ml-2 ${choiceClassName}`, className)}
            key={value}
          >
            <label
              htmlFor={`${field.name}-${value}`}
              className={classNames('', labelClassName)}
            >
              <input
                value={value}
                checked={mappableValue.includes(value)}
                className={classNames(
                  'mr-2 h-4 w-4 rounded-sm border-slate-300 dark:border-slate-600 bg-white dark:!bg-slate-800 text-slate-950 focus:ring-slate-800',
                  inputClassName,
                )}
                disabled={field.disabled}
                id={`${field.name}-${value}`}
                name={field.name}
                onChange={field.onChange}
                type={field.multiple ? 'checkbox' : 'radio'}
              />
              <span>{display}</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChoicesField;
