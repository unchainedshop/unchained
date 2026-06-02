import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import clsx from 'clsx';
import { useIntl } from 'react-intl';
import Badge from '../Badge';

const normalizeTagValue = (tags) => {
  if (tags) {
    if (Array.isArray(tags)) return tags;
    return tags
      .toString()
      ?.split(',')
      ?.map((str) => str.trim());
  }
  return [];
};

const TagInput = ({
  tagList: tags,
  onChange,
  disabled = false,
  name = 'tag-input',
  id = 'tag-input',
  placeholder = '',
  selectOptions = [],
  className = '',
  buttonText = '',
  showTagsInline = true,
}) => {
  const { formatMessage } = useIntl();
  const [tagList, setTagList] = useState(normalizeTagValue(tags));
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTagList(normalizeTagValue(tags));
  }, [tags]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const onRemoveTag = (tag) => {
    const index = tagList.indexOf(tag);
    if (index !== -1) {
      const newTags = [...tagList];
      newTags.splice(index, 1);
      onChange(newTags);
      setTagList(newTags);
    }
  };

  const addTag = useCallback(
    (tag: string) => {
      if (!tagList.includes(tag) && tag) {
        const newTags = [...tagList, tag];
        setTagList(newTags);
        onChange(newTags);
        setInputValue('');
        setIsOpen(false);
      }
    },
    [tagList, onChange],
  );

  const filteredOptions = useMemo(() => {
    const available = selectOptions.filter(
      (option) => !(tagList || []).includes(option.value),
    );
    if (!inputValue) return available;
    return available.filter((opt) =>
      opt.label.toLowerCase().includes(inputValue.toLowerCase()),
    );
  }, [selectOptions, tagList, inputValue]);

  const showCreateOption =
    inputValue.trim() &&
    !tagList.includes(inputValue.trim()) &&
    !filteredOptions.some(
      (opt) => opt.value.toLowerCase() === inputValue.trim().toLowerCase(),
    );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      addTag(inputValue.trim());
    }
  };

  const TagInputComponent = (
    <div className="relative" ref={wrapperRef}>
      <input
        id={id}
        name={name}
        type="text"
        role="combobox"
        aria-expanded={isOpen}
        aria-autocomplete="list"
        disabled={disabled}
        className={clsx(
          'w-full rounded-md border border-border-default bg-surface-input py-2.5 pl-4 pr-4 text-sm text-text-primary placeholder:text-text-muted shadow-xs focus:outline-hidden focus:ring-2 focus:ring-focus-ring',
          className,
        )}
        placeholder={placeholder}
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
      />
      {isOpen && (showCreateOption || filteredOptions.length > 0) && (
        <ul
          role="listbox"
          className="absolute z-9999999 mt-1 max-h-60 w-full overflow-auto rounded-md bg-surface border border-border-subtle py-1 text-sm shadow-lg"
        >
          {showCreateOption && (
            <li
              role="option"
              aria-selected={false}
              className="cursor-pointer select-none py-2 px-4 text-text-primary hover:bg-surface-raised"
              onMouseDown={(e) => {
                e.preventDefault();
                addTag(inputValue.trim());
              }}
            >
              {buttonText ||
                formatMessage(
                  {
                    id: 'add_new_tag',
                    defaultMessage: 'Add "{inputValue}"',
                  },
                  { inputValue: inputValue.trim() },
                )}
            </li>
          )}
          {filteredOptions.map((opt) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={false}
              className="cursor-pointer select-none py-2 px-4 text-text-primary hover:bg-surface-raised"
              onMouseDown={(e) => {
                e.preventDefault();
                addTag(opt.value);
              }}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  if (!showTagsInline) {
    return TagInputComponent;
  }

  return (
    <>
      {TagInputComponent}
      <div
        className={clsx(
          'ml-4 flex items-center flex-wrap gap-5',
          tagList.length > 0 && 'mt-1',
        )}
      >
        {tagList?.map((tag) => (
          <Badge
            key={tag}
            text={tag}
            color="slate"
            onClick={() => onRemoveTag(tag)}
          />
        ))}
      </div>
    </>
  );
};

export default TagInput;
