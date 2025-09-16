import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  IDeliveryProviderQuery,
  IDeliveryProviderQueryVariables,
} from '../../../gql/types';
import useUnchainedContext from '../../UnchainedContext/useUnchainedContext';
import DeliveryProviderFragment from '../fragments/DeliveryProviderFragment';

const GetDeliveryProviderQuery = (inlineFragment = '') => gql`
  query DeliveryProvider($deliveryProviderId: ID!) {
    deliveryProvider(deliveryProviderId: $deliveryProviderId) {
      ...DeliveryProviderFragment
      ${inlineFragment}
    }
  }
  ${DeliveryProviderFragment}
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
