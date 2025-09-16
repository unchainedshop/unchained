import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { IUserQuery, IUserQueryVariables } from '../../../gql/types';
import useUnchainedContext from '../../UnchainedContext/useUnchainedContext';
import UserFragment from '../fragment/UserFragment';

const GetUserQuery = (inlineFragment = '') => gql`
  query User($userId: ID) {
    user(userId: $userId) {
      ${inlineFragment}
      ...UserFragment
    }
  }
  ${UserFragment}
`;

const useUser = ({ userId = null }: IUserQueryVariables = {}) => {
  const { customProperties, hydrateFragment } = useUnchainedContext();

  const { data, loading, error } = useQuery<IUserQuery, IUserQueryVariables>(
    GetUserQuery(customProperties?.User),
    {
      skip: !userId,
      variables: { userId },
    },
  );

  const user = data?.user;
  const extendedData = hydrateFragment(customProperties?.User, user);

  return {
    user,
    loading,
    error,
    extendedData,
  };
};

export default useUser;
