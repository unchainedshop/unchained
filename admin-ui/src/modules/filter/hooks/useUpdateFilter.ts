import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IUpdateFilterMutation,
  IUpdateFilterMutationVariables,
} from '../../../gql/types';
import FilterFragment from '../fragments/FilterFragment';

const UpdateFilterMutation = gql`
  mutation UpdateFilter($filter: UpdateFilterInput!, $filterId: ID!) {
    updateFilter(filter: $filter, filterId: $filterId) {
      ...FilterFragment
    }
  }
  ${FilterFragment}
`;

const useUpdateFilter = () => {
  const [updateFilterMutation] = useMutation<
    IUpdateFilterMutation,
    IUpdateFilterMutationVariables
  >(UpdateFilterMutation);

  const updateFilter = async ({
    filterId,
    filter,
  }: IUpdateFilterMutationVariables) => {
    return updateFilterMutation({
      variables: { filter, filterId },
    });
  };

  return {
    updateFilter,
  };
};

export default useUpdateFilter;
