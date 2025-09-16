import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  IUsersCountQuery,
  IUsersCountQueryVariables,
} from '../../../gql/types';

const UsersCountQuery = gql`
  query UsersCount(
    $includeGuests: Boolean
    $queryString: String
    $lastLogin: DateFilterInput
    $emailVerified: Boolean
  ) {
    usersCount(
      includeGuests: $includeGuests
      queryString: $queryString
      lastLogin: $lastLogin
      emailVerified: $emailVerified
    )
  }
`;

const useUsersCount = ({
  includeGuests = false,
  queryString = null,
  lastLogin = null,
  emailVerified = null,
}: IUsersCountQueryVariables = {}) => {
  const { data, loading, error } = useQuery<
    IUsersCountQuery,
    IUsersCountQueryVariables
  >(UsersCountQuery, {
    variables: {
      includeGuests,
      queryString,
      lastLogin,
      emailVerified,
    },
  });

  return {
    usersCount: data?.usersCount || 0,
    loading,
    error,
  };
};

export default useUsersCount;
