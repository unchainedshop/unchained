import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  IDeliveryProvidersQuery,
  IDeliveryProvidersQueryVariables,
} from '../../../gql/types';
import AddressFragment from '../../common/fragments/AddressFragment';

const DeliveryProvidersQuery = gql`
  query DeliveryProviders($type: DeliveryProviderType) {
    deliveryProviders(type: $type) {
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
    deliveryProvidersCount(type: $type)
  }
  ${AddressFragment}
`;

const useDeliveryProviders = ({
  type = null,
}: IDeliveryProvidersQueryVariables = {}) => {
  const { data, loading, error } = useQuery<
    IDeliveryProvidersQuery,
    IDeliveryProvidersQueryVariables
  >(DeliveryProvidersQuery, {
    variables: { type },
  });

  const deliveryProviders = data?.deliveryProviders || [];
  return {
    deliveryProviders,
    loading,
    error,
    deliveryProvidersCount: data?.deliveryProvidersCount || 0,
  };
};

export default useDeliveryProviders;
