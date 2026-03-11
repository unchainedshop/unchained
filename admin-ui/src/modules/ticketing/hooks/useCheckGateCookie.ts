import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { useCurrentUser } from '../../accounts';
import {
  ICheckGateCookieQuery,
  ICheckGateCookieQueryVariables,
} from '../../../gql/types';

const CheckGateCookieQuery = gql`
  query CheckGateCookie {
    isPassCodeValid
  }
`;
const useCheckGateCookie = () => {
  const { currentUser } = useCurrentUser();
  const isAdmin = Boolean(currentUser?._id);
  const { data, loading, refetch } = useQuery<
    ICheckGateCookieQuery,
    ICheckGateCookieQueryVariables
  >(CheckGateCookieQuery, {
    fetchPolicy: 'cache-and-network',
    skip: isAdmin,
  });
  const authenticated = isAdmin || data?.isPassCodeValid === true;
  return {
    authenticated,
    loading,
    refetch,
  };
};

export default useCheckGateCookie;
