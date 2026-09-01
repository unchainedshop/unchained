import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

const CheckGateCookieQuery = gql`
  query CheckGateCookie {
    isPassCodeValid
  }
`;

const useCheckGateCookie = () => {
  const { data, loading, refetch } = useQuery(CheckGateCookieQuery, {
    fetchPolicy: 'cache-and-network',
  });
  const authenticated = (data as any)?.isPassCodeValid === true;
  return {
    authenticated,
    loading,
    refetch,
  };
};

export default useCheckGateCookie;
