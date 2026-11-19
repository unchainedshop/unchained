import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  IProductsCountQuery,
  IProductsCountQueryVariables,
} from '../../../gql/types';

const ProductsCountQuery = gql`
  query ProductsCount(
    $queryString: String
    $tags: [LowerCaseString!]
    $slugs: [String!]
    $includeDrafts: Boolean
    $type: ProductType
  ) {
    productsCount(
      tags: $tags
      slugs: $slugs
      includeDrafts: $includeDrafts
      queryString: $queryString
      type: $type
    )
  }
`;

const useProductsCount = ({
  queryString = '',
  tags = null,
  includeDrafts = true,
  type = null,
}: IProductsCountQueryVariables) => {
  const { data, loading, error } = useQuery<
    IProductsCountQuery,
    IProductsCountQueryVariables
  >(ProductsCountQuery, {
    errorPolicy: 'all',
    variables: {
      queryString,
      includeDrafts,
      tags,
      type,
    },
  });

  const productsCount = data?.productsCount;

  return {
    productsCount,
    loading,
    error,
  };
};

export default useProductsCount;
