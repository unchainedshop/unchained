import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  IEnrollmentsQuery,
  IEnrollmentsQueryVariables,
} from '../../../gql/types';
import EnrollmentFragment from '../fragments/EnrollmentFragment';

const EnrollmentsQuery = gql`
  query Enrollments(
    $offset: Int
    $limit: Int
    $queryString: String
    $sort: [SortOptionInput!]
    $status: [String!]
  ) {
    enrollments(
      offset: $offset
      limit: $limit
      queryString: $queryString
      sort: $sort
      status: $status
    ) {
      ...EnrollmentFragment
    }
    enrollmentsCount
  }
  ${EnrollmentFragment}
`;

const useEnrollments = ({
  limit = 20,
  offset = 0,
  queryString = '',
  sort = [],
  status = null,
  forceLocale = '',
}: IEnrollmentsQueryVariables & { forceLocale?: string } = {}) => {
  const { data, loading, error, fetchMore } = useQuery<
    IEnrollmentsQuery,
    IEnrollmentsQueryVariables
  >(EnrollmentsQuery, {
    context: {
      headers: {
        forceLocale,
      },
    },
    variables: { limit, offset, queryString, sort, status },
  });
  const enrollments = data?.enrollments || [];
  const enrollmentsCount = data?.enrollmentsCount;
  const hasMore = enrollments?.length < enrollmentsCount;

  const loadMore = () => {
    fetchMore({
      variables: { offset: enrollments?.length },
    });
  };

  return {
    enrollments,
    enrollmentsCount,
    hasMore,
    loading,
    error,
    loadMore,
  };
};

export default useEnrollments;
