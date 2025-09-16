import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IRemoveDeliveryProviderMutation,
  IRemoveDeliveryProviderMutationVariables,
} from '../../../gql/types';

const RemoveDeliveryProviderMutation = gql`
  mutation RemoveDeliveryProvider($deliveryProviderId: ID!) {
    removeDeliveryProvider(deliveryProviderId: $deliveryProviderId) {
      _id
    }
  }
`;

const useRemoveDeliveryProvider = () => {
  const [removeDeliveryProviderMutation] = useMutation<
    IRemoveDeliveryProviderMutation,
    IRemoveDeliveryProviderMutationVariables
  >(RemoveDeliveryProviderMutation);

  const removeDeliveryProvider = async ({
    deliveryProviderId,
  }: IRemoveDeliveryProviderMutationVariables) => {
    return removeDeliveryProviderMutation({
      variables: {
        deliveryProviderId,
      },
      refetchQueries: ['DeliveryProviders', 'ShopStatus'],
    });
  };

  return {
    removeDeliveryProvider,
  };
};

export default useRemoveDeliveryProvider;
