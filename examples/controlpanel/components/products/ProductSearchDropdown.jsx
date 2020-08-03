import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Search } from 'semantic-ui-react';
import { debounce, has } from 'lodash';
import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';

const SEARCH_PRODUCTS = gql`
  query search($queryString: String) {
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
        media {
          texts {
            title
          }
          file {
            url
            name
          }
        }
      }
    }
  }
`;

const ProductSearchDropdown = () => {
  const router = useRouter();
  const [queryString, setQueryString] = useState('');
  const { data, loading } = useQuery(SEARCH_PRODUCTS, {
    variables: {
      queryString,
    },
    skip: !queryString,
  });
  const handleResultSelect = (e, { result }) => {
    setQueryString(result.texts.title);
    router.push({ pathname: '/products/edit', query: { _id: result._id } });
  };
  const handleSearchChange = (e, { value }) => {
    setQueryString(value);
  };

  const pollyfillImageUrl = 'https://via.placeholder.com/150';

  const selectImage = (result) => {
    if (!result.media) return pollyfillImageUrl;

    const foundImageObj = result.media.find((mediaObj) => {
      if (has(mediaObj, 'file.url')) {
        const imageObj = new Image();
        imageObj.src = mediaObj.file.url;
        return imageObj.complete;
      }
      return false;
    });
    return (
      (foundImageObj && foundImageObj.file && foundImageObj.file.url) ||
      pollyfillImageUrl
    );
  };

  const results =
    data?.search?.products.map((result) => {
      return {
        id: result._id,
        title: result.texts.title,
        description: result.texts.description,
        image: selectImage(result),
        active: !(result.status === 'ACTIVE'),
      };
    }) || [];
  return (
    <Search
      loading={loading}
      style={{ float: 'left' }}
      onResultSelect={handleResultSelect}
      onSearchChange={debounce(handleSearchChange, 500, {
        leading: true,
      })}
      results={results}
      // resultRenderer={resultRenderer}
    />
  );
};

export default ProductSearchDropdown;
