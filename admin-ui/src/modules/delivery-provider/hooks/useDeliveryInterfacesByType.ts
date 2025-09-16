import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  IDeliveryInterfacesQuery,
  IDeliveryInterfacesQueryVariables,
} from '../../../gql/types';

const DeliveryInterfacesQuery = gql`
  query DeliveryInterfaces($providerType: DeliveryProviderType) {
    deliveryInterfaces(type: $providerType) {
      _id
      value: _id
      label
    }
  }
`;

const useDeliveryInterfacesByType = ({
  providerType = null,
}: IDeliveryInterfacesQueryVariables) => {
  const { data, loading, error } = useQuery<
    IDeliveryInterfacesQuery,
    IDeliveryInterfacesQueryVariables
  >(DeliveryInterfacesQuery, {
    skip: !providerType,
    variables: { providerType },
  });

  const deliveryInterfaces = data?.deliveryInterfaces || [];

  return {
    deliveryInterfaces,
    loading,
    error,
  };
};

export default useDeliveryInterfacesByType;
