import { IUpdateShopSettingsMutation, IUpdateShopSettingsMutationVariables } from '../../../gql/types';
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';

const UpdateShopSettingsMutation = gql`
  mutation UpdateShopSettings($namespace: String!, $value: JSON!) {
    updateShopSettings(namespace: $namespace, value: $value)
  }
`;

const useUpdateShopSettings = () => {
  const [updateShopSettingsMutation, { loading, error }] = useMutation<IUpdateShopSettingsMutation, IUpdateShopSettingsMutationVariables>(
    UpdateShopSettingsMutation,
  );

  const updateShopSettings = async ({
    namespace,
    value,
  }: {
    namespace: string;
    value: Record<string, unknown>;
  }) => {
    return updateShopSettingsMutation({
      variables: { namespace, value },
      refetchQueries: ['ShopSettings', 'ShopInfo'],
    });
  };

  return { updateShopSettings, loading, error };
};

export default useUpdateShopSettings;
