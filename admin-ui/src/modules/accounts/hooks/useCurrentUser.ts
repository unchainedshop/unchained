import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  ICurrentUserQuery,
  ICurrentUserQueryVariables,
  IUser,
} from '../../../gql/types';
import useUnchainedContext from '../../UnchainedContext/useUnchainedContext';
import UserFragment from '../fragment/UserFragment';

export const GetCurrentUserQuery = (inlineFragment = '') => gql`
  query CurrentUser {
    me {
      ...UserFragment
      ${inlineFragment}
    }
  }
  ${UserFragment}
`;

const useCurrentUser = (params?: ICurrentUserQueryVariables) => {
  const { customProperties, hydrateFragment } = useUnchainedContext();
  const { data, loading, error } = useQuery<
    ICurrentUserQuery,
    ICurrentUserQueryVariables
  >(GetCurrentUserQuery(customProperties?.User));

  const currentUser = data?.me as IUser;
  const extendedData = hydrateFragment(
    customProperties?.User,
    currentUser || null,
  );

  return {
    currentUser,
    loading,
    error,
    extendedData,
  };
};

export default useCurrentUser;
