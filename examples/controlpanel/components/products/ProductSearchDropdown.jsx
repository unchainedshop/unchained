import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Search } from 'semantic-ui-react';
import { debounce } from 'lodash';
import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';

const SEARCH_PRODUCTS = gql`
  query search($queryString: String) {
    search(queryString: $queryString, includeInactive: true) {
      totalProducts
      products {
        _id
        texts {
          _id
          title
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
  const resultRenderer = (result) => <div>{result.texts.title}</div>;
  const results = data?.search?.products || [];
  return (
    <Search
      style={{ float: 'left' }}
      loading={loading}
      onResultSelect={handleResultSelect}
      onSearchChange={debounce(handleSearchChange, 500, {
        leading: true,
      })}
      results={results}
      resultRenderer={resultRenderer}
    />
  );
};

export default ProductSearchDropdown;
