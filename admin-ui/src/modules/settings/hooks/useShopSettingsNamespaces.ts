import { IShopSettingsNamespacesQuery, IShopSettingsNamespacesQueryVariables } from '../../../gql/types';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

const ShopSettingsNamespacesQuery = gql`
  query ShopSettingsNamespaces {
    shopSettingsNamespaces
  }
`;

const useShopSettingsNamespaces = () => {
  const { data, loading, error } = useQuery<IShopSettingsNamespacesQuery, IShopSettingsNamespacesQueryVariables>(
    ShopSettingsNamespacesQuery,
    { fetchPolicy: 'cache-and-network' },
  );

  return {
    namespaces: data?.shopSettingsNamespaces || [],
    loading,
    error,
  };
};

export default useShopSettingsNamespaces;
