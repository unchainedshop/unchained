import { gql } from '@apollo/client';

import { useQuery } from '@apollo/client/react';

import {
  IProductsQuery,
  IProductsQueryVariables,
  ISortOptionInput,
} from '../../../gql/types';

import ProductBriefFragment from '../fragments/ProductBriefFragment';

const ProductsQuery = gql`
  query Products(
    $queryString: String
    $tags: [LowerCaseString!]
    $slugs: [String!]
    $limit: Int
    $offset: Int
    $includeDrafts: Boolean
    $sort: [SortOptionInput!]
  ) {
    products(
      queryString: $queryString
      tags: $tags
      slugs: $slugs
      limit: $limit
      offset: $offset
      includeDrafts: $includeDrafts
      sort: $sort
    ) {
      ...ProductBriefFragment
    }
    productsCount(
      tags: $tags
      slugs: $slugs
      includeDrafts: $includeDrafts
      queryString: $queryString
    )
  }
  ${ProductBriefFragment}
`;

const useProducts = ({
  queryString = '',
  limit = 20,
  offset = 0,
  tags = null,
  includeDrafts = true,
  slugs = null,
  sort: sortOptions = [],
  forceLocale = '',
}: IProductsQueryVariables & { forceLocale?: string } = {}) => {
  const { data, loading, error, fetchMore, client } = useQuery<
    IProductsQuery,
    IProductsQueryVariables
  >(ProductsQuery, {
    context: {
      headers: {
        forceLocale,
      },
    },
    variables: {
      queryString,
      limit,
      offset,
      includeDrafts,
      tags,
      slugs,
      sort: sortOptions.length
        ? sortOptions
        : ([{ key: 'sequence', value: 'ASC' }] as ISortOptionInput[]),
    },
  });
  const products = data?.products || [];
  const productsCount = data?.productsCount;
  const hasMore = products?.length < productsCount;

  const loadMore = () => {
    fetchMore({
      variables: { offset: products.length },
    });
  };

  return {
    products,
    productsCount,
    hasMore,
    loading,
    error,
    loadMore,
    client,
  };
};

export default useProducts;
