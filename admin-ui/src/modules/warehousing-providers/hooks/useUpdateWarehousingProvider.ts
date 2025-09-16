import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IUpdateWarehousingProviderMutation,
  IUpdateWarehousingProviderMutationVariables,
} from '../../../gql/types';
import WarehousingProviderFragment from '../fragments/WarehousingProviderFragment';

const UpdateWarehousingProviderMutation = gql`
  mutation UpdateWarehousingProvider(
    $warehousingProvider: UpdateProviderInput!
    $warehousingProviderId: ID!
  ) {
    updateWarehousingProvider(
      warehousingProvider: $warehousingProvider
      warehousingProviderId: $warehousingProviderId
    ) {
      ...WarehousingProviderFragment
    }
  }
  ${WarehousingProviderFragment}
`;

const useUpdateWarehousingProvider = () => {
  const [updateWarehousingProviderMutation] = useMutation<
    IUpdateWarehousingProviderMutation,
    IUpdateWarehousingProviderMutationVariables
  >(UpdateWarehousingProviderMutation);

  const updateWarehousingProvider = async ({
    warehousingProvider: { configuration },
    warehousingProviderId,
  }: IUpdateWarehousingProviderMutationVariables) => {
    return updateWarehousingProviderMutation({
      variables: {
        warehousingProvider: { configuration },
        warehousingProviderId,
      },
    });
  };

  return {
    updateWarehousingProvider,
  };
};

export default useUpdateWarehousingProvider;
