import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IRemoveWarehousingProviderMutation,
  IRemoveWarehousingProviderMutationVariables,
} from '../../../gql/types';

const RemoveWarehousingProviderMutation = gql`
  mutation RemoveWarehousingProvider($warehousingProviderId: ID!) {
    removeWarehousingProvider(warehousingProviderId: $warehousingProviderId) {
      _id
    }
  }
`;

const useRemoveWarehousingProvider = () => {
  const [removeWarehousingProviderMutation] = useMutation<
    IRemoveWarehousingProviderMutation,
    IRemoveWarehousingProviderMutationVariables
  >(RemoveWarehousingProviderMutation);

  const removeWarehousingProvider = async ({
    warehousingProviderId,
  }: IRemoveWarehousingProviderMutationVariables) => {
    return removeWarehousingProviderMutation({
      variables: {
        warehousingProviderId,
      },
      refetchQueries: ['WarehousingProviders', 'ShopStatus'],
    });
  };

  return {
    removeWarehousingProvider,
  };
};

export default useRemoveWarehousingProvider;
