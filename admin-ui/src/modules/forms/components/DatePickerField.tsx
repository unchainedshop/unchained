import classnames from 'classnames';

import useField, { FieldHookProps } from '../hooks/useField';
import { validateDate } from '../lib/validators';
import FieldWrapper from './FieldWrapper';

const defaultParseDate = (value: string) => {
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
};

const DatePickerField = ({
  validators = [],
  className,
  parseDate = defaultParseDate,
  ...props
}: FieldHookProps) => {
  const field = useField({
    validators: [...validators, validateDate],
    ...props,
  });

  const formattedValue = field.value
    ? new Date(field.value).toISOString().split('T')[0]
    : '';

  return (
    <FieldWrapper {...field} className={props.containerClassName}>
      <input
        type="date"
        id={field.id}
        name={field.name}
        disabled={field.disabled}
        className={classnames(
          'relative mt-0 block w-full appearance-none rounded-md rounded-b-md border-1 border-slate-300 dark:border-slate-700 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-200 dark:bg-slate-900 placeholder-slate-400 shadow-xs focus:z-10  focus:outline-hidden focus:ring-2 focus:ring-slate-800',
          className,
          {
            'border-rose-700 placeholder:text-rose-300': !!field.error,
          },
        )}
        onChange={(e) => field.setValue(e.target.value)}
        value={formattedValue}
        placeholder={field.placeholder}
        autoComplete="off"
        {...props}
      />
    </FieldWrapper>
  );
};

export default DatePickerField;
