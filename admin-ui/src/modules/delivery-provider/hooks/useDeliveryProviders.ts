import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  IDeliveryProvidersQuery,
  IDeliveryProvidersQueryVariables,
} from '../../../gql/types';
import DeliveryProviderFragment from '../fragments/DeliveryProviderFragment';

const DeliveryProvidersQuery = gql`
  query DeliveryProviders($type: DeliveryProviderType) {
    deliveryProviders(type: $type) {
      ...DeliveryProviderFragment
    }
    deliveryProvidersCount(type: $type)
  }
  ${DeliveryProviderFragment}
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
