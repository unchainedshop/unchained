import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  ICreateWarehousingProviderMutation,
  ICreateWarehousingProviderMutationVariables,
} from '../../../gql/types';
import WarehousingProviderFragment from '../fragments/WarehousingProviderFragment';

const CreateWarehousingProviderMutation = gql`
  mutation CreateWarehousingProvider(
    $warehousingProvider: CreateWarehousingProviderInput!
  ) {
    createWarehousingProvider(warehousingProvider: $warehousingProvider) {
      ...WarehousingProviderFragment
    }
  }
  ${WarehousingProviderFragment}
`;

const useCreateWarehousingProvider = () => {
  const [createWarehousingProviderMutation, { data, loading, error }] =
    useMutation<
      ICreateWarehousingProviderMutation,
      ICreateWarehousingProviderMutationVariables
    >(CreateWarehousingProviderMutation);

  const createWarehousingProvider = async ({
    warehousingProvider: { adapterKey, type },
  }: ICreateWarehousingProviderMutationVariables) => {
    return createWarehousingProviderMutation({
      variables: { warehousingProvider: { adapterKey, type } },
      refetchQueries: ['WarehousingProviders', 'ShopStatus'],
    });
  };

  const newWarehousingProvider = data?.createWarehousingProvider;

  return {
    createWarehousingProvider,
    newWarehousingProvider,
    loading,
    error,
  };
};

export default useCreateWarehousingProvider;
