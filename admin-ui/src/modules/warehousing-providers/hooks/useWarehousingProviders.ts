import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  IWarehousingProvidersQuery,
  IWarehousingProvidersQueryVariables,
} from '../../../gql/types';
import WarehousingProviderFragment from '../fragments/WarehousingProviderFragment';

const WarehousingProvidersQuery = gql`
  query WarehousingProviders($type: WarehousingProviderType) {
    warehousingProviders(type: $type) {
      ...WarehousingProviderFragment
    }
    warehousingProvidersCount(type: $type)
  }
  ${WarehousingProviderFragment}
`;

const useWarehousingProviders = ({
  type = null,
}: IWarehousingProvidersQueryVariables = {}) => {
  const variables: any = {};
  if (type) variables.type = type;
  const { data, loading, error }: any = useQuery<
    IWarehousingProvidersQuery,
    IWarehousingProvidersQueryVariables
  >(WarehousingProvidersQuery, {
    variables,
  });

  const warehousingProviders = data?.warehousingProviders || [];

  return {
    warehousingProviders,
    loading,
    error,
    warehousingProvidersCount: data?.warehousingProvidersCount || 0,
  };
};

export default useWarehousingProviders;
