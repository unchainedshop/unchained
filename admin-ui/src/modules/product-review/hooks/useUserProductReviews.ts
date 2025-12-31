import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  ISortDirection,
  IUserProductReviewsQuery,
  IUserProductReviewsQueryVariables,
} from '../../../gql/types';

import ProductBriefFragment from '../../product/fragments/ProductBriefFragment';
import ProductReviewDetailFragment from '../fragments/ProductReviewDetailFragment';

const ProductReviewQuery = gql`
  query UserProductReviews(
    $userId: ID!
    $limit: Int
    $offset: Int
    $sort: [SortOptionInput!]
  ) {
    user(userId: $userId) {
      _id
      reviews(limit: $limit, offset: $offset, sort: $sort) {
        ...ProductReviewDetailFragment
        product {
          ...ProductBriefFragment
        }
      }
      reviewsCount
    }
  }
  ${ProductReviewDetailFragment}
  ${ProductBriefFragment}
`;

const useUserProductReviews = ({
  userId = null,
  limit = 10,
  offset = 0,
  sort: sortOptions = [{ key: 'created', value: ISortDirection.Desc }],
}: IUserProductReviewsQueryVariables) => {
  const { data, loading, error, fetchMore } = useQuery<
    IUserProductReviewsQuery,
    IUserProductReviewsQueryVariables
  >(ProductReviewQuery, {
    skip: !userId,
    variables: {
      userId,
      limit,
      offset,
      sort: sortOptions,
    },
  });
  const user = data?.user;
  const reviews = user?.reviews || [];
  const reviewsCount = user?.reviewsCount || 0;

  const loadMore = () => {
    fetchMore({
      variables: { offset: reviews?.length },
    });
  };

  return {
    reviews,
    loading,
    error,
    loadMore,
    reviewsCount,
  };
};

export default useUserProductReviews;
