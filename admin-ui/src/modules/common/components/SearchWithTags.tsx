import React from 'react';
import { useIntl } from 'react-intl';
import { useRouter } from 'next/router';
import SearchField from './SearchField';
import TagInput from './TagInput';
import Badge from './Badge';
import { normalizeQuery } from '../utils/utils';
import { isTruthy } from '../utils/normalizeFilterKeys';

const SearchWithTags = ({
  children,
  onSearchChange,
  defaultSearchValue,
  showTagFilter = false,
  availableTagOptions = [],
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
      <div className="my-3 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
          <div className="flex-shrink-0">
            <SearchField
              onInputChange={onSearchChange}
              defaultValue={defaultSearchValue}
            />
          </div>
          {showTagFilter && (
            <div className="flex flex-col gap-2 flex-1 sm:border-l sm:border-slate-300 sm:dark:border-slate-700 sm:pl-3">
              <div className="max-w-xs">
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
                  selectOptions={availableTagOptions}
                  showTagsInline={false}
                />
              </div>
              {(query?.tags as string)?.split(',').filter(Boolean).length >
                0 && (
                <div className="flex flex-wrap gap-2">
                  {(query?.tags as string)
                    ?.split(',')
                    .filter(Boolean)
                    .map((tag) => (
                      <Badge
                        key={tag}
                        text={tag}
                        color="slate"
                        onClick={() => {
                          const newTags = (query?.tags as string)
                            ?.split(',')
                            .filter((t) => t !== tag);
                          handleTagChange(newTags.length > 0 ? newTags : null);
                        }}
                      />
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {children}
    </div>
  );
};

export default SearchWithTags;
