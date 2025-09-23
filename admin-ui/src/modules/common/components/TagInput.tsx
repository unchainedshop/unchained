import React, { useMemo, useState } from 'react';
import classNames from 'classnames';
import { useIntl } from 'react-intl';
import CreatableSelect from 'react-select/creatable';
import Badge from './Badge';
import useTheme from '../hooks/useTheme';

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

const getCreatableSelectStyles = (theme) => {
  const baseStyles = {
    control: (provided, state) => ({
      ...provided,
      borderWidth: '1px',
      borderRadius: '0.375rem',
      minHeight: '42px',
      paddingLeft: '16px',
      paddingRight: '16px',
      boxShadow: state.isFocused
        ? '0 0 0 2px #1e293b'
        : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: '0',
    }),
    input: (provided) => ({
      ...provided,
      margin: 0,
      padding: 0,
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 9999999,
    }),
    menuList: (provided) => ({
      ...provided,
      maxHeight: '300px',
      overflowY: 'auto',
    }),
    option: (provided, state) => ({
      ...provided,
      padding: '10px 16px',
    }),
  };

  if (theme === 'dark') {
    return {
      control: (base, state) => ({
        ...baseStyles.control(base, state),
        backgroundColor: '#0f172a',
        borderColor: state.isFocused ? '#1e293b' : '#374151',
      }),
      input: (base) => ({
        ...baseStyles.input(base),
        color: '#f1f5f9',
      }),
      menu: (base) => ({
        ...baseStyles.menu(base),
        backgroundColor: '#0f172a',
        border: '1px solid #1e293b',
      }),
      option: (base, state) => ({
        ...baseStyles.option(base, state),
        backgroundColor: state.isFocused ? '#1e293b' : 'transparent',
        color: '#f1f5f9',
      }),
      placeholder: (base) => ({
        ...base,
        color: '#64748b',
      }),
    };
  }

  return {
    control: (base, state) => ({
      ...baseStyles.control(base, state),
      backgroundColor: '#ffffff',
      borderColor: state.isFocused ? '#1e293b' : '#cbd5e1',
    }),
    input: (base) => ({
      ...baseStyles.input(base),
      color: '#0f172a',
    }),
    menu: (base) => ({
      ...baseStyles.menu(base),
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
    }),
    option: (base, state) => ({
      ...baseStyles.option(base, state),
      backgroundColor: state.isFocused ? '#f1f5f9' : 'transparent',
      color: '#0f172a',
    }),
    placeholder: (base) => ({
      ...base,
      color: '#9ca3af',
    }),
  };
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
  const { theme } = useTheme();
  const [tagList, setTagList] = useState(normalizeTagValue(tags));
  const [inputValue, setInputValue] = useState('');

  const getGlobalPortal = () => {
    let portal = document.getElementById('global-tag-input-portal');
    if (!portal) {
      portal = document.createElement('div');
      portal.id = 'global-tag-input-portal';
      portal.className = 'tag-input-portal';
      Object.assign(portal.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh',
        zIndex: '9999999',
        pointerEvents: 'none',
      });
      document.body.appendChild(portal);
    }
    return portal;
  };

  const onRemoveTag = (tag) => {
    const index = tagList.indexOf(tag);
    if (index !== -1) {
      const newTags = [...tagList];
      newTags.splice(index, 1);
      onChange(newTags);
      setTagList(newTags);
    }
  };

  const addTag = (tag: string) => {
    if (!tagList.includes(tag) && tag) {
      const newTags = [...tagList, tag];
      setTagList(newTags);
      onChange(newTags);
      setInputValue('');
    }
  };

  useMemo(() => {
    setTagList(normalizeTagValue(tags));
  }, [tags]);
  const TagInputComponent = (
    <CreatableSelect
      id={id || name}
      name={name}
      placeholder={placeholder}
      components={{ SingleValue: () => null }}
      isDisabled={disabled}
      inputValue={inputValue}
      onInputChange={(newValue, { action }) => {
        if (action !== 'input-blur' && action !== 'menu-close') {
          setInputValue(newValue);
        }
      }}
      onChange={(option) => option && addTag(option.value)}
      onCreateOption={addTag}
      options={selectOptions.filter(
        (option) => !(tagList || []).includes(option.value),
      )}
      value={null}
      formatCreateLabel={(value) =>
        buttonText ||
        formatMessage(
          { id: 'add_new_tag', defaultMessage: 'Add "{inputValue}"' },
          { inputValue: value },
        )
      }
      noOptionsMessage={({ inputValue: input }) =>
        input
          ? formatMessage(
              {
                id: 'no_options',
                defaultMessage: 'No options found for "{inputValue}"',
              },
              { inputValue: input },
            )
          : placeholder
      }
      styles={getCreatableSelectStyles(theme)}
      className={`w-full tag-input-creatable ${className}`}
      classNamePrefix="react-select"
      menuPortalTarget={getGlobalPortal()}
      menuShouldBlockScroll={false}
    />
  );
  if (!showTagsInline) {
    return TagInputComponent;
  }

  return (
    <>
      {TagInputComponent}

      <div
        className={classNames(
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
