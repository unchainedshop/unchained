import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IUpdateDeliveryProviderMutation,
  IUpdateDeliveryProviderMutationVariables,
} from '../../../gql/types';
import DeliveryProviderFragment from '../fragments/DeliveryProviderFragment';

const UpdateDeliveryProviderMutation = gql`
  mutation UpdateDeliveryProvider(
    $deliveryProvider: UpdateProviderInput!
    $deliveryProviderId: ID!
  ) {
    updateDeliveryProvider(
      deliveryProvider: $deliveryProvider
      deliveryProviderId: $deliveryProviderId
    ) {
      ...DeliveryProviderFragment
    }
  }
  ${DeliveryProviderFragment}
`;

const useUpdateDeliveryProvider = () => {
  const [updateDeliveryProviderMutation] = useMutation<
    IUpdateDeliveryProviderMutation,
    IUpdateDeliveryProviderMutationVariables
  >(UpdateDeliveryProviderMutation);

  const updateDeliveryProvider = async ({
    deliveryProvider: { configuration },
    deliveryProviderId,
  }: IUpdateDeliveryProviderMutationVariables) => {
    return updateDeliveryProviderMutation({
      variables: {
        deliveryProvider: { configuration },
        deliveryProviderId,
      },
    });
  };

  return {
    updateDeliveryProvider,
  };
};

export default useUpdateDeliveryProvider;
