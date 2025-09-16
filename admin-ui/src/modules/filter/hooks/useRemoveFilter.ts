import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IRemoveFilterMutation,
  IRemoveFilterMutationVariables,
} from '../../../gql/types';

const RemoveFilterMutation = gql`
  mutation RemoveFilter($filterId: ID!) {
    removeFilter(filterId: $filterId) {
      _id
    }
  }
`;

const useRemoveFilter = () => {
  const [removeFilterMutation] = useMutation<
    IRemoveFilterMutation,
    IRemoveFilterMutationVariables
  >(RemoveFilterMutation);

  const removeFilter = async ({ filterId }: IRemoveFilterMutationVariables) => {
    return removeFilterMutation({
      variables: { filterId },
      refetchQueries: ['Filters'],
    });
  };

  return {
    removeFilter,
  };
};

export default useRemoveFilter;
