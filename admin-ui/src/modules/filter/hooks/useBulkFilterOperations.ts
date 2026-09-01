import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IBulkRemoveFiltersMutation,
  IBulkRemoveFiltersMutationVariables,
  IBulkSetFilterActiveMutation,
  IBulkSetFilterActiveMutationVariables,
} from '../../../gql/types';

const BulkRemoveFiltersMutation = gql`
  mutation BulkRemoveFilters($filterIds: [ID!]!) {
    bulkRemoveFilters(filterIds: $filterIds) {
      successCount
      failedCount
      failedIds
    }
  }
`;

const BulkSetFilterActiveMutation = gql`
  mutation BulkSetFilterActive($filterIds: [ID!]!, $isActive: Boolean!) {
    bulkSetFilterActive(filterIds: $filterIds, isActive: $isActive) {
      successCount
      failedCount
      failedIds
    }
  }
`;

const refetchQueries = ['Filters', 'FiltersCount'];

const useBulkFilterOperations = () => {
  const [bulkRemoveMutation] = useMutation<
    IBulkRemoveFiltersMutation,
    IBulkRemoveFiltersMutationVariables
  >(BulkRemoveFiltersMutation);
  const [bulkSetActiveMutation] = useMutation<
    IBulkSetFilterActiveMutation,
    IBulkSetFilterActiveMutationVariables
  >(BulkSetFilterActiveMutation);

  return {
    bulkRemoveFilters: (filterIds: string[]) =>
      bulkRemoveMutation({
        variables: { filterIds },
        refetchQueries,
        awaitRefetchQueries: true,
      }),

    bulkSetFilterActive: (filterIds: string[], isActive: boolean) =>
      bulkSetActiveMutation({
        variables: { filterIds, isActive },
        refetchQueries,
        awaitRefetchQueries: true,
      }),
  };
};

export default useBulkFilterOperations;
