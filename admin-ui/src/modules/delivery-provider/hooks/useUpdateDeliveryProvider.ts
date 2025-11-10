import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IUpdateDeliveryProviderMutation,
  IUpdateDeliveryProviderMutationVariables,
} from '../../../gql/types';
import AddressFragment from '../../common/fragments/AddressFragment';

const UpdateDeliveryProviderMutation = gql`
  mutation UpdateDeliveryProvider(
    $deliveryProvider: UpdateProviderInput!
    $deliveryProviderId: ID!
  ) {
    updateDeliveryProvider(
      deliveryProvider: $deliveryProvider
      deliveryProviderId: $deliveryProviderId
    ) {
      _id
      created
      updated
      deleted
      type
      isActive
      configuration
      interface {
        _id
        label
        version
      }
      configurationError
      ... on DeliveryProviderPickUp {
        pickUpLocations {
          _id
          name
          address {
            ...AddressFragment
          }
        }
      }
    }
  }
  ${AddressFragment}
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
