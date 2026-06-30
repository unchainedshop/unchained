import React from 'react';
import clsx from 'clsx';

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
    <div className={clsx('flex flex-col gap-1', containerClassName)}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-text-secondary">
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
        className={clsx(
          'w-full rounded-md border-1 border-border-default bg-surface-input px-3 py-2 text-sm shadow-xs text-text-primary focus:outline-hidden focus:ring-2 focus:ring-focus-ring dark:[color-scheme:dark]',
          className,
        )}
      />
    </div>
  );
};

export default DateInputField;
