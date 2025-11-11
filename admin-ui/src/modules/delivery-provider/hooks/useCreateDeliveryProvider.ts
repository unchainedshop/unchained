import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  ICreateDeliveryProviderMutation,
  ICreateDeliveryProviderMutationVariables,
} from '../../../gql/types';
import AddressFragment from '../../common/fragments/AddressFragment';

const CreateDeliveryProviderMutation = gql`
  mutation CreateDeliveryProvider(
    $deliveryProvider: CreateDeliveryProviderInput!
  ) {
    createDeliveryProvider(deliveryProvider: $deliveryProvider) {
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
