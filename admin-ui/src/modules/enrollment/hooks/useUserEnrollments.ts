import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  IUserEnrollmentsQuery,
  IUserEnrollmentsQueryVariables,
} from '../../../gql/types';

const UserEnrollmentsQuery = gql`
  query UserEnrollments($userId: ID!, $queryString: String) {
    user(userId: $userId) {
      _id
      enrollments(queryString: $queryString) {
        _id
        enrollmentNumber
        status
        created
        expires
        isExpired
        plan {
          product {
            _id
            media {
              _id
              file {
                _id
                url
              }
            }
            texts {
              _id
              title
            }
          }
          quantity
        }
      }
    }
  }
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
