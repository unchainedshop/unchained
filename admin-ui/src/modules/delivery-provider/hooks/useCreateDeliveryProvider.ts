import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  ICreateDeliveryProviderMutation,
  ICreateDeliveryProviderMutationVariables,
} from '../../../gql/types';

import DeliveryProviderFragment from '../fragments/DeliveryProviderFragment';

const CreateDeliveryProviderMutation = gql`
  mutation CreateDeliveryProvider(
    $deliveryProvider: CreateDeliveryProviderInput!
  ) {
    createDeliveryProvider(deliveryProvider: $deliveryProvider) {
      ...DeliveryProviderFragment
    }
  }
  ${DeliveryProviderFragment}
`;

const useCreateDeliveryProvider = () => {
  const [createDeliveryProviderMutation, { data, error, loading }] =
    useMutation<
      ICreateDeliveryProviderMutation,
      ICreateDeliveryProviderMutationVariables
    >(CreateDeliveryProviderMutation);

  const createDeliveryProvider = async ({
    deliveryProvider: { adapterKey, type },
  }: ICreateDeliveryProviderMutationVariables) => {
    return createDeliveryProviderMutation({
      variables: { deliveryProvider: { adapterKey, type } },
      refetchQueries: ['DeliveryProviders', 'ShopStatus'],
    });
  };

  const newDeliveryProvider = data?.createDeliveryProvider;

  return {
    createDeliveryProvider,
    newDeliveryProvider,
    loading,
    error,
  };
};

export default useCreateDeliveryProvider;
