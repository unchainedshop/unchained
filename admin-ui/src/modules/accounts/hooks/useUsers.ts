import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { IUsersQuery, IUsersQueryVariables } from '../../../gql/types';
import UserFragment from '../fragment/UserFragment';

const UsersQuery = gql`
  query Users(
    $limit: Int
    $offset: Int
    $includeGuests: Boolean
    $queryString: String
    $lastLogin: DateFilterInput
    $emailVerified: Boolean
  ) {
    users(
      limit: $limit
      offset: $offset
      includeGuests: $includeGuests
      queryString: $queryString
      lastLogin: $lastLogin
      emailVerified: $emailVerified
    ) {
      ...UserFragment
    }
    usersCount(
      includeGuests: $includeGuests
      queryString: $queryString
      lastLogin: $lastLogin
      emailVerified: $emailVerified
    )
  }
  ${UserFragment}
`;

const useUsers = ({
  limit = 20,
  offset = 0,
  includeGuests = false,
  queryString = null,
  lastLogin = null,
  emailVerified = null,
}: IUsersQueryVariables) => {
  const { data, loading, error, fetchMore } = useQuery<
    IUsersQuery,
    IUsersQueryVariables
  >(UsersQuery, {
    variables: {
      limit,
      offset,
      includeGuests,
      queryString,
      lastLogin,
      emailVerified,
    },
  });

  const users = data?.users || [];
  const usersCount = data?.usersCount;
  const hasMore = users?.length < usersCount;

  const loadMore = () => {
    fetchMore({
      variables: { offset: users?.length },
    });
  };

  return {
    users,
    usersCount,
    hasMore,
    loading,
    error,
    loadMore,
  };
};

export default useUsers;
