import React, { useState } from 'react';
import {
  Dropdown,
  Header,
  Image as SemanticImage,
  Icon,
  Label,
} from 'semantic-ui-react';
import { debounce, has, isEmpty } from 'lodash';
import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';

const SEARCH_PRODUCTS = gql`
  query search($queryString: String, $limit: Int) {
    search(queryString: $queryString, includeInactive: true) {
      totalProducts
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

const ProductSearchDropdown = ({
  onChange,
  value,
  optionValues,
  placeholder,
  disabled,
  uniforms,
}) => {
  const [queryString, setQueryString] = useState('');
  const { data, loading } = useQuery(SEARCH_PRODUCTS, {
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

  const selectImage = (product) => {
    if (isEmpty(product.media)) return imageComponent;
    const foundImageObj = product.media.find((mediaObj) => {
      if (has(mediaObj, 'file.url')) {
        const imageObj = new Image();
        imageObj.src = mediaObj.file.url;
        return imageObj.complete;
      }
      return false;
    });
    return (
      (foundImageObj && (
        <SemanticImage
          src={foundImageObj && foundImageObj.file && foundImageObj.file.url}
          alt={foundImageObj.texts.title || product.texts.title}
        />
      )) ||
      imageComponent
    );
  };

  const options =
    data?.search?.products.map((product) => {
      return {
        key: product._id,
        value: product._id,
        text: product.texts.title,
        content: (
          <Header>
            {selectImage(product)}
            <Header.Content>
              {product.texts.title}
              <Header.Subheader>{product.texts.description}</Header.Subheader>
              <Label
                color={product.status === 'DRAFT' ? 'red' : 'green'}
                horizontal
              >
                {product.status}
              </Label>
            </Header.Content>
          </Header>
        ),
      };
    }) || [];

  return (
    <Dropdown
      search
      fluid
      selection
      placeholder={placeholder || 'Select Product'}
      name="product"
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
  );
};
export default ProductSearchDropdown;
