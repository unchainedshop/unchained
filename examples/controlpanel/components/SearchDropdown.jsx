import React, { useState } from 'react';
import {
  Dropdown,
  Header,
  Image as SemanticImage,
  Icon,
  Label,
} from 'semantic-ui-react';
import { debounce, has, isEmpty } from 'lodash';
import { useQuery } from '@apollo/client';
import classnames from 'classnames';

const SearchDropdown = ({
  onChange,
  value,
  label,
  multiple,
  optionValues,
  placeholder,
  disabled,
  uniforms,
  className,
  queryType,
  error,
  required,
  id,
  name,
  filterIds,
  searchQuery,
  limit,
  isShowGuests,
}) => {
  const [queryString, setQueryString] = useState('');

  const { data, loading } = useQuery(searchQuery, {
    variables: {
      queryString,
      limit: limit || 10,
      ...(isShowGuests && { includeGuests: isShowGuests }),
    },
    skip: !queryString,
  });

  const handleOnChange = (e, result) => {
    return onChange(result.value);
  };

  const handleSearchChange = (e, result) => {
    setQueryString(result.searchQuery);
  };

  const imageComponent = <Icon name="image" size="mini" />;

  const selectImage = (item) => {
    if (isEmpty(item.media)) return imageComponent;
    const foundImageObj = item.media.find((mediaObj) => {
      if (has(mediaObj, 'file.url')) {
        const imageObj = new Image();
        imageObj.src = mediaObj.file.url;
        return imageObj.complete;
      }
      return false;
    });
    return foundImageObj ? (
      <SemanticImage
        src={foundImageObj && foundImageObj.file && foundImageObj.file.url}
        alt={foundImageObj?.texts?.title || item.texts?.title}
      />
    ) : (
      imageComponent
    );
  };

  const resolveStatus = ({ isActive, status }) => {
    if (status) {
      return {
        status,
        color: status === 'DRAFT' ? 'red' : 'green',
      };
    }
    return {
      status: isActive ? 'ACTIVE' : 'DRAFT',
      color: isActive ? 'green' : 'red',
    };
  };

  const queries = {
    assortments: data?.searchAssortments?.assortments,
    products: data?.searchProducts?.products,
    users: data?.users,
  };
  let items = queries[queryType] || [];

  items = filterIds
    ? items?.filter((item) => !filterIds.includes(item._id))
    : items;

  const options =
    items?.map((item) => {
      return {
        key: item._id,
        value: item._id,
        text: item?.texts?.title || item?.name || item?.type,
        content: (
          <Header>
            {!(queryType === 'users') && selectImage(item)}
            <Header.Content>
              {item?.texts?.title || item?.name || item?._id?.toLowerCase()}
              {!(queryType === 'users') && (
                <>
                  <Header.Subheader>{item.texts.description}</Header.Subheader>
                  <Label color={resolveStatus(item).color} horizontal>
                    {resolveStatus(item).status}
                  </Label>
                </>
              )}
            </Header.Content>
          </Header>
        ),
      };
    }) || [];

  return (
    <div
      className={classnames({ disabled, error, required }, className, 'field')}
    >
      {label && <label htmlFor={id}>{label}</label>}
      <Dropdown
        multiple={multiple}
        name={name || 'item'}
        disabled={disabled}
        id={id || 'search-dropdown'}
        search={(allOptions) => {
          return allOptions; // don't use the internal filter function because options get pre filtered
        }}
        deburr={false}
        fluid
        selection
        placeholder={placeholder || 'Select item'}
        loading={loading}
        onChange={uniforms ? handleOnChange : onChange} // this is to handle uniforms custom field
        onSearchChange={debounce(handleSearchChange, 500, {
          leading: true,
        })}
        options={options}
        value={value}
        optionValues={optionValues}
        style={{ marginBottom: '1em' }}
      />
    </div>
  );
};
export default SearchDropdown;
