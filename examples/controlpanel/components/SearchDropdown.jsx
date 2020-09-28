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
import gql from 'graphql-tag';
import classnames from 'classnames';

const SearchDropdown = ({
  onChange,
  value,
  label,
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
}) => {
  const SEARCH_ASSORTMENTS = gql`
    query searchAssortments($queryString: String) {
      searchAssortments(queryString: $queryString, includeInactive: true) {
        assortments {
          _id
          isActive
          texts {
            _id
            title
            description
          }
        }
      }
    }
  `;

  const SEARCH_PRODUCTS = gql`
    query searchProducts($queryString: String, $limit: Int) {
      searchProducts(queryString: $queryString, includeInactive: true) {
        products {
          _id
          status
          texts {
            _id
            title
            description
          }
          media(limit: $limit) {
            texts {
              _id
              title
            }
            file {
              _id
              url
              name
            }
          }
        }
      }
    }
  `;

  const [queryString, setQueryString] = useState('');
  const QUERY =
    queryType === 'assortments' ? SEARCH_ASSORTMENTS : SEARCH_PRODUCTS;

  const { data, loading } = useQuery(QUERY, {
    variables: {
      queryString,
      limit: 1,
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
        alt={
          (foundImageObj && foundImageObj.texts && foundImageObj.texts.title) ||
          item.texts.title
        }
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

  let items =
    queryType === 'assortments'
      ? data?.searchAssortments.assortments
      : data?.searchProducts.products || [];

  items = filterIds
    ? items?.filter((item) => !filterIds.includes(item._id))
    : items;

  const options =
    items?.map((item) => {
      return {
        key: item._id,
        value: item._id,
        text: item.texts.title,
        content: (
          <Header>
            {selectImage(item)}
            <Header.Content>
              {item.texts.title}
              <Header.Subheader>{item.texts.description}</Header.Subheader>
              <Label color={resolveStatus(item).color} horizontal>
                {resolveStatus(item).status}
              </Label>
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
        name={name || 'item'}
        disabled={disabled}
        id={id || 'search-dropdown'}
        search
        fluid
        selection
        placeholder={placeholder || 'Select item'}
        loading={loading}
        onChange={uniforms ? handleOnChange : onChange} // this is to handle uniforms custom field
        onSearchChange={debounce(handleSearchChange, 500, {
          leading: true,
        })}
        options={options}
        {...{ ...(value && { value }) }}
        {...{ ...(disabled && { disabled }) }}
        {...{ ...(optionValues && { optionValues }) }}
        style={{ marginBottom: '1em' }}
      />
    </div>
  );
};
export default SearchDropdown;
