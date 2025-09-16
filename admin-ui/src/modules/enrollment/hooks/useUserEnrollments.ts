import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  IUserEnrollmentsQuery,
  IUserEnrollmentsQueryVariables,
} from '../../../gql/types';
import EnrollmentFragment from '../fragments/EnrollmentFragment';

const UserEnrollmentsQuery = gql`
  query UserEnrollments($userId: ID!, $queryString: String) {
    user(userId: $userId) {
      _id
      enrollments(queryString: $queryString) {
        ...EnrollmentFragment
      }
    }
  }
  ${EnrollmentFragment}
`;

const useUserEnrollments = ({
  userId = null,
  queryString = '',
}: IUserEnrollmentsQueryVariables) => {
  const { data, loading, error } = useQuery<
    IUserEnrollmentsQuery,
    IUserEnrollmentsQueryVariables
  >(UserEnrollmentsQuery, {
    skip: !userId,
    variables: { userId, queryString },
  });
  const enrollments = data?.user?.enrollments || [];

  return {
    enrollments,
    loading,
    error,
  };
};

export default useUserEnrollments;
