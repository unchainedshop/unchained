import { useEffect, useRef, useState } from 'react';

import Combobox from '@/components/ui/form/Combobox';

const MultipleSelect = ({ tagList: tags, onChange, options, label }) => {
  const didInitialize = useRef(false);
  const didMount = useRef(false);

  const [tagList, setTagList] = useState<string[]>([]);

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

  useEffect(() => {
    if (didMount.current) {
      onChange(tagList);
    } else {
      didMount.current = true;
    }
  }, [tagList]);

  return (
    <div className="mt-2 flex-col sm:mt-0">
      {label && (
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
          {label}
        </h3>
      )}
      <Combobox
        id="tag-input"
        multiple
        options={options}
        value={tagList}
        onChange={(val) => setTagList(val as string[])}
        placeholder={label}
      />
    </div>
  );
};

export default MultipleSelect;
