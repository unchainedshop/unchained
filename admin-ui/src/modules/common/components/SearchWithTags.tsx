import React from 'react';
import { useIntl } from 'react-intl';
import { useRouter } from 'next/router';
import SearchField from './SearchField';
import TagInput from './TagInput';
import { normalizeQuery } from '../utils/utils';
import { isTruthy } from '../utils/normalizeFilterKeys';

const SearchWithTags = ({
  children,
  onSearchChange,
  defaultSearchValue,
  showTagFilter = false,
}) => {
  const { formatMessage } = useIntl();

  const { query, push } = useRouter();

  const handleTagChange = (value) => {
    if (isTruthy(value)) {
      push({
        query: normalizeQuery(query, value?.join(','), 'tags'),
      });
    } else {
      const { tags, ...rest } = query;
      push({
        query: normalizeQuery(rest),
      });
    }
  };

  return (
    <div>
      <div className="my-3 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
        <div className="flex flex-wrap gap-3">
          <div className="w-fit">
            <SearchField
              onInputChange={onSearchChange}
              defaultValue={defaultSearchValue}
            />
          </div>
          {showTagFilter && (
            <div className="w-fit lg:border-l lg:border-slate-300 lg:dark:border-slate-700 lg:pl-3 flex items-center">
              <TagInput
                buttonText={formatMessage({
                  id: 'apply',
                  defaultMessage: 'Apply',
                })}
                placeholder={formatMessage({
                  id: 'enter_tag',
                  defaultMessage: 'Enter tag...',
                })}
                tagList={(query?.tags as string)?.split(',')}
                onChange={handleTagChange}
              />
            </div>
          )}
        </div>
      </div>

      {children}
    </div>
  );
};

export default SearchWithTags;
