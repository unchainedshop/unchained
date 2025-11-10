import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  IDeliveryProviderQuery,
  IDeliveryProviderQueryVariables,
} from '../../../gql/types';
import useUnchainedContext from '../../UnchainedContext/useUnchainedContext';
import AddressFragment from '../../common/fragments/AddressFragment';

const GetDeliveryProviderQuery = (inlineFragment = '') => gql`
  query DeliveryProvider($deliveryProviderId: ID!) {
    deliveryProvider(deliveryProviderId: $deliveryProviderId) {
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
    ...on DeliveryProviderPickUp {          
      pickUpLocations {
        _id
        name
        address {
          ...AddressFragment
        }        
      }   
    }
      ${inlineFragment}
    }
  }
  ${AddressFragment}
`;

const useDeliveryProvider = ({
  deliveryProviderId = null,
}: IDeliveryProviderQueryVariables) => {
  const { customProperties } = useUnchainedContext();
  const { data, loading, error } = useQuery<
    IDeliveryProviderQuery,
    IDeliveryProviderQueryVariables
  >(GetDeliveryProviderQuery(customProperties?.DeliveryProvider), {
    skip: !deliveryProviderId,
    variables: { deliveryProviderId },
  });

  return {
    deliveryProvider: data?.deliveryProvider,
    loading,
    error,
  };
};

export default useDeliveryProvider;
