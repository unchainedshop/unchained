import { IShopSettingsQuery, IShopSettingsQueryVariables } from '@/gql/operation-types';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

const ShopSettingsQuery = gql`
  query ShopSettings($namespace: String!) {
    shopSettingsSchema(namespace: $namespace)
    shopInfo {
      _id
      settings(namespace: $namespace)
    }
  }
`;


const useShopSettings = ({ namespace }: { namespace: string }) => {
  const { data, loading, error } = useQuery<IShopSettingsQuery, IShopSettingsQueryVariables>(
    ShopSettingsQuery,
    {
      variables: { namespace },
      fetchPolicy: 'cache-and-network',
    },
  );

  return {
    schema: (data?.shopSettingsSchema as Record<string, unknown>) || null,
    values: (data?.shopInfo?.settings as Record<string, unknown>) || {},
    loading,
    error,
  };
};

export default useShopSettings;
