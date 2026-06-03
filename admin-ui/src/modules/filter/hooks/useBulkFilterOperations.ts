import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';

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
  const [bulkRemoveMutation] = useMutation(BulkRemoveFiltersMutation);
  const [bulkSetActiveMutation] = useMutation(BulkSetFilterActiveMutation);

  return {
    bulkRemoveFilters: (filterIds: string[]) =>
      bulkRemoveMutation({
        variables: { filterIds },
        refetchQueries,
      }),

    bulkSetFilterActive: (filterIds: string[], isActive: boolean) =>
      bulkSetActiveMutation({
        variables: { filterIds, isActive },
        refetchQueries,
      }),
  };
};

export default useBulkFilterOperations;
