import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  IWarehousingProviderQuery,
  IWarehousingProviderQueryVariables,
} from '../../../gql/types';
import useUnchainedContext from '../../UnchainedContext/useUnchainedContext';
import WarehousingProviderFragment from '../fragments/WarehousingProviderFragment';

const GetWarehousingProviderQuery = (inlineFragment = '') => gql`
  query WarehousingProvider($warehousingProviderId: ID!) {
    warehousingProvider(warehousingProviderId: $warehousingProviderId) {
      ...WarehousingProviderFragment
      ${inlineFragment}
    }
  }
  ${WarehousingProviderFragment}
`;

const useWarehousingProvider = ({
  warehousingProviderId = null,
}: IWarehousingProviderQueryVariables) => {
  const { customProperties } = useUnchainedContext();
  const { data, loading, error } = useQuery<
    IWarehousingProviderQuery,
    IWarehousingProviderQueryVariables
  >(GetWarehousingProviderQuery(customProperties?.WarehousingProvider), {
    skip: !warehousingProviderId,
    variables: { warehousingProviderId },
  });

  return {
    warehousingProvider: data?.warehousingProvider,
    loading,
    error,
  };
};

export default useWarehousingProvider;
