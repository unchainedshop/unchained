import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

const ShopSettingsNamespacesQuery = gql`
  query ShopSettingsNamespaces {
    shopSettingsNamespaces
  }
`;

const useShopSettingsNamespaces = () => {
  const { data, loading, error } = useQuery(ShopSettingsNamespacesQuery, {
    fetchPolicy: 'cache-and-network',
  });

  return {
    namespaces: (data?.shopSettingsNamespaces as string[]) || [],
    loading,
    error,
  };
};

export default useShopSettingsNamespaces;
