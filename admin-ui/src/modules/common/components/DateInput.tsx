import React from 'react';
import classNames from 'classnames';

type DateInputFieldProps = {
  id: string;
  label?: string;
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  min?: string;
  max?: string;
  className?: string;
  containerClassName?: string;
};

const DateInputField: React.FC<DateInputFieldProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  min,
  max,
  className,
  containerClassName,
}) => {
  return (
    <div className={classNames('flex flex-col gap-1', containerClassName)}>
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          {label}
        </label>
      )}
      <input
        type="date"
        id={id}
        value={value || ''}
        onChange={(e) => {
          const val = e.target.value;
          onChange(val ? val : null);
        }}
        placeholder={placeholder}
        min={min}
        max={max}
        className={classNames(
          'w-full rounded-md border-1 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm shadow-xs text-slate-900 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-800 dark:[color-scheme:dark]',
          className,
        )}
      />
    </div>
  );
};

export default DateInputField;
