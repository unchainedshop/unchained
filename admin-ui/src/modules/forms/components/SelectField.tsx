import classnames from 'classnames';

import useField, { FieldHookProps } from '../hooks/useField';
import FieldWrapper from './FieldWrapper';

import type { JSX } from 'react';

export interface SelectFieldOptions {
  [key: string]: string | JSX.Element;
}

interface SelectFieldProps extends FieldHookProps {
  options: SelectFieldOptions;
}

const SelectField = (props: SelectFieldProps) => {
  const { options, ...field } = useField(props);
  const { className } = props || { className: '' };
  return (
    <FieldWrapper {...field}>
      <div className="select-wrap">
        <select
          className={classnames(
            'block w-full dark:bg-slate-900 dark:text-white rounded-md border-1 border-slate-300 dark:border-slate-700 py-2.5 pl-3 pr-10 text-base text-black shadow-xs  focus:outline-hidden focus:ring-2 focus:ring-slate-800 sm:text-sm',
            className,
            {
              'border-rose-700 text-rose-600 dark:border-rose-500 dark:text-rose-400':
                !!field.error,
            },
          )}
          disabled={field.disabled}
          id={field.name}
          name={field.name}
          onChange={field.onChange}
          onBlur={field.onBlur}
          value={field.value}
        >
          <option
            className="dark:text-slate-200"
            value=""
            disabled={field.required}
            hidden={field.required}
          >
            {field.placeholder || field.label}
          </option>

          {Object.entries(options).map(([display, value]: any) => (
            <option className="dark:text-slate-200" key={value} value={value}>
              {display}
            </option>
          ))}
        </select>
      </div>
    </FieldWrapper>
  );
};

export default SelectField;
