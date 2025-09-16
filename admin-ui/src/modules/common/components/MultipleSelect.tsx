import { useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';

import Badge from './Badge';

const MultipleSelect = ({ tagList: tags, onChange, options, label }) => {
  const { formatMessage } = useIntl();
  const didInitialize = useRef(false);
  const didMount = useRef(false);

  const [tagList, setTagList] = useState([]);

  // Re-initialize tagList ONCE when options become available
  useEffect(() => {
    if (!didInitialize.current && options.length > 0) {
      const tagSet = new Set(tags || []);
      const initial = options
        .filter(({ label }) => tagSet.has(label))
        .map(({ value }) => value);
      setTagList(initial);
      didInitialize.current = true;
    }
  }, [options, tags]);
  // Prevent onChange on first render
  useEffect(() => {
    if (didMount.current) {
      onChange(tagList);
    } else {
      didMount.current = true;
    }
  }, [tagList]);

  const onRemoveTag = (tag) => {
    setTagList((prev) => prev.filter((t) => t !== tag));
  };

  const addTag = (value) => {
    if (value && !tagList.includes(value)) {
      setTagList((prev) => [...prev, value]);
    }
  };

  return (
    <div className="mt-2 flex-col sm:mt-0">
      {label && (
        <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200 uppercase tracking-wide mb-3">
          {label}
        </h3>
      )}
      <div>
        {tagList.map((tag) => {
          const label = options.find((o) => o.value === tag)?.label || tag;
          return (
            <Badge
              key={tag}
              text={label}
              color="slate"
              onClick={() => onRemoveTag(tag)}
              className="ml-2 mb-2"
            />
          );
        })}
      </div>
      <div>
        <div className="mt-1 flex max-w-full rounded-md shadow-xs dark:text-slate-200">
          <div className="relative flex grow items-stretch focus-within:z-10">
            <select
              id="tag-input"
              className="mt-1 block w-full rounded-md dark:bg-slate-800 border-slate-300 dark:border-slate-700 py-2 pl-3 text-base focus:outline-hidden focus:ring-slate-800 sm:text-sm"
              onChange={(e) => addTag(e.target.value)}
              value=""
            >
              <option value="">
                {formatMessage({
                  id: 'select_option',
                  defaultMessage: 'Select an option',
                })}
              </option>
              {options.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  className="dark:text-slate-200"
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultipleSelect;
