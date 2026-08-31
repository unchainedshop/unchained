import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { useCurrentUser } from '../../accounts';

const CheckGateCookieQuery = gql`
  query CheckGateCookie {
    isPassCodeValid
  }
`;
const useCheckGateCookie = () => {
  const { currentUser } = useCurrentUser();
  const isAdmin = Boolean(currentUser?._id);
  const { data, loading, refetch } = useQuery(CheckGateCookieQuery, {
    fetchPolicy: 'cache-and-network',
    skip: isAdmin,
  });
  const authenticated = isAdmin || (data as any)?.isPassCodeValid === true;
  return {
    authenticated,
    loading,
    refetch,
  };
};

export default useCheckGateCookie;
