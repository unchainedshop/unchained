import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  ISystemRolesQuery,
  ISystemRolesQueryVariables,
} from '../../../gql/types';

const SystemRolesQuery = gql`
  query SystemRoles {
    shopInfo {
      _id
      userRoles
    }
  }
`;

const useSystemRoles = () => {
  const { data, loading, error } = useQuery<
    ISystemRolesQuery,
    ISystemRolesQueryVariables
  >(SystemRolesQuery);
  return {
    systemRoles: data?.shopInfo?.userRoles || [],
    loading,
    error,
  };
};

export default useSystemRoles;
