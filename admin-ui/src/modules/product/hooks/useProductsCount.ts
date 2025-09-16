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
  ) {
    productsCount(
      tags: $tags
      slugs: $slugs
      includeDrafts: $includeDrafts
      queryString: $queryString
    )
  }
`;

const useProductsCount = ({
  queryString = '',
  tags = null,
  includeDrafts = true,
}: IProductsCountQueryVariables) => {
  const { data, loading, error } = useQuery<
    IProductsCountQuery,
    IProductsCountQueryVariables
  >(ProductsCountQuery, {
    variables: {
      queryString,
      includeDrafts,
      tags,
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
