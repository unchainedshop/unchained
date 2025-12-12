import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  IProductReviewsQuery,
  IProductReviewsQueryVariables,
  ISortDirection,
} from '../../../gql/types';
import ProductReviewDetailFragment from '../../product-review/fragments/ProductReviewDetailFragment';
import useApp from '../../common/hooks/useApp';

const ProductReviewQuery = gql`
  query ProductReviews(
    $queryString: String
    $limit: Int
    $offset: Int
    $sort: [SortOptionInput!]
    $forceLocale: Locale
  ) {
    productReviews(
      queryString: $queryString
      limit: $limit
      offset: $offset
      sort: $sort
    ) {
      ...ProductReviewDetailFragment
    }
  }
  ${ProductReviewDetailFragment}
`;

const useProductReviews = ({
  queryString = '',
  limit = 10,
  offset = 0,
  sort: sortOptions = [],
}: IProductReviewsQueryVariables = {}) => {
  const { selectedLocale } = useApp();
  const { data, loading, error } = useQuery<
    IProductReviewsQuery,
    IProductReviewsQueryVariables
  >(ProductReviewQuery, {
    variables: {
      queryString,
      limit: limit || 10,
      offset: offset || 0,
      sort: sortOptions?.length
        ? sortOptions
        : [{ key: 'created', value: ISortDirection.Desc }],
      forceLocale: selectedLocale,
    },
  });

  const reviews = data?.productReviews || [];

  return {
    reviews,
    loading,
    error,
  };
};

export default useProductReviews;
