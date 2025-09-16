import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IRemoveFilterOptionMutation,
  IRemoveFilterOptionMutationVariables,
} from '../../../gql/types';

const RemoveFilterOptionMutation = gql`
  mutation RemoveFilterOption($filterId: ID!, $filterOptionValue: String!) {
    removeFilterOption(
      filterId: $filterId
      filterOptionValue: $filterOptionValue
    ) {
      _id
    }
  }
`;

const useRemoveFilterOption = () => {
  const [removeFilterOptionMutation] = useMutation<
    IRemoveFilterOptionMutation,
    IRemoveFilterOptionMutationVariables
  >(RemoveFilterOptionMutation);

  const removeFilterOption = async ({
    filterId,
    filterOptionValue,
  }: IRemoveFilterOptionMutationVariables) => {
    return removeFilterOptionMutation({
      variables: { filterOptionValue, filterId },
      refetchQueries: ['FilterOptions'],
    });
  };

  return {
    removeFilterOption,
  };
};

export default useRemoveFilterOption;
