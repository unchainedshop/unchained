import { useState, useMemo } from 'react';
import {
  Combobox as HeadlessCombobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  ComboboxButton,
} from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import clsx from 'clsx';
import Badge from '../Badge';

export interface IComboboxOption {
  label: string;
  value: string;
}

interface ComboboxProps {
  options: IComboboxOption[];
  value?: string | string[];
  onChange: (value: string | string[] | null) => void;
  onSearch?: (query: string) => void;
  placeholder?: string;
  multiple?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
  name?: string;
  id?: string;
  className?: string;
}

const Combobox = ({
  options,
  value,
  onChange,
  onSearch,
  placeholder = 'Search...',
  multiple = false,
  isLoading = false,
  disabled = false,
  name,
  id,
  className,
}: ComboboxProps) => {
  const [query, setQuery] = useState('');

  const filteredOptions = useMemo(() => {
    if (onSearch) return options;
    if (!query) return options;
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(query.toLowerCase()),
    );
  }, [options, query, onSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    onSearch?.(q);
  };

  const selectedLabels = useMemo(() => {
    if (!multiple || !Array.isArray(value)) return [];
    return value
      .map((v) => options.find((o) => o.value === v))
      .filter(Boolean) as IComboboxOption[];
  }, [value, options, multiple]);

  const displayValue = useMemo(() => {
    if (multiple) return '';
    if (!value || Array.isArray(value)) return '';
    return options.find((o) => o.value === value)?.label || '';
  }, [value, options, multiple]);

  if (multiple) {
    return (
      <div className={className}>
        {selectedLabels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {selectedLabels.map((opt) => (
              <Badge
                key={opt.value}
                text={opt.label}
                color="slate"
                onClick={() => {
                  const next = (value as string[]).filter(
                    (v) => v !== opt.value,
                  );
                  onChange(next);
                }}
              />
            ))}
          </div>
        )}
        <HeadlessCombobox
          value={(value as string[]) || []}
          onChange={onChange as (value: string[]) => void}
          multiple
          disabled={disabled}
          name={name}
          immediate
        >
          <div className="relative">
            <ComboboxInput
              id={id}
              className="w-full rounded-md border border-border-default bg-surface-input py-2 pl-3 pr-10 text-sm text-text-primary placeholder:text-text-muted shadow-xs focus:outline-hidden focus:ring-2 focus:ring-focus-ring"
              placeholder={placeholder}
              onChange={handleInputChange}
              displayValue={() => query}
            />
            <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon
                className="h-5 w-5 text-text-muted"
                aria-hidden="true"
              />
            </ComboboxButton>
            <ComboboxOptions className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-surface border border-border-subtle py-1 text-sm shadow-lg focus:outline-hidden">
              {isLoading ? (
                <div className="px-4 py-2 text-text-muted">Loading...</div>
              ) : filteredOptions.length === 0 ? (
                <div className="px-4 py-2 text-text-muted">
                  No results found
                </div>
              ) : (
                filteredOptions.map((opt) => (
                  <ComboboxOption
                    key={opt.value}
                    value={opt.value}
                    className="group relative cursor-pointer select-none py-2 pl-10 pr-4 text-text-primary data-focus:bg-surface-raised"
                  >
                    {({ selected }) => (
                      <>
                        <span
                          className={clsx(
                            'block truncate',
                            selected && 'font-medium',
                          )}
                        >
                          {opt.label}
                        </span>
                        {selected && (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-accent">
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        )}
                      </>
                    )}
                  </ComboboxOption>
                ))
              )}
            </ComboboxOptions>
          </div>
        </HeadlessCombobox>
      </div>
    );
  }

  return (
    <HeadlessCombobox
      value={value || null}
      onChange={onChange}
      disabled={disabled}
      name={name}
    >
      <div className={clsx('relative', className)}>
        <ComboboxInput
          id={id}
          className="w-full rounded-md border border-border-default bg-surface-input py-2.5 pl-4 pr-10 text-sm text-text-primary placeholder:text-text-muted shadow-xs focus:outline-hidden focus:ring-2 focus:ring-focus-ring"
          placeholder={placeholder}
          onChange={handleInputChange}
          displayValue={() => query || displayValue}
        />
        <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
          <ChevronUpDownIcon
            className="h-5 w-5 text-text-muted"
            aria-hidden="true"
          />
        </ComboboxButton>
        <ComboboxOptions className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-surface border border-border-subtle py-1 text-sm shadow-lg focus:outline-hidden">
          {isLoading ? (
            <div className="px-4 py-2 text-text-muted">Loading...</div>
          ) : filteredOptions.length === 0 ? (
            <div className="px-4 py-2 text-text-muted">No results found</div>
          ) : (
            filteredOptions.map((opt) => (
              <ComboboxOption
                key={opt.value}
                value={opt.value}
                className="group relative cursor-pointer select-none py-2 pl-10 pr-4 text-text-primary data-focus:bg-surface-raised"
              >
                {({ selected }) => (
                  <>
                    <span
                      className={clsx(
                        'block truncate',
                        selected && 'font-medium',
                      )}
                    >
                      {opt.label}
                    </span>
                    {selected && (
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-accent">
                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                      </span>
                    )}
                  </>
                )}
              </ComboboxOption>
            ))
          )}
        </ComboboxOptions>
      </div>
    </HeadlessCombobox>
  );
};

export default Combobox;
