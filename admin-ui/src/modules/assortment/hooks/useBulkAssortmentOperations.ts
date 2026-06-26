import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';

const BulkRemoveAssortmentsMutation = gql`
  mutation BulkRemoveAssortments($assortmentIds: [ID!]!) {
    bulkRemoveAssortments(assortmentIds: $assortmentIds) {
      successCount
      failedCount
      failedIds
    }
  }
`;

const BulkUpdateAssortmentTagsMutation = gql`
  mutation BulkUpdateAssortmentTags(
    $assortmentIds: [ID!]!
    $add: [LowerCaseString!]
    $remove: [LowerCaseString!]
  ) {
    bulkUpdateAssortmentTags(
      assortmentIds: $assortmentIds
      add: $add
      remove: $remove
    ) {
      successCount
      failedCount
      failedIds
    }
  }
`;

const BulkSetAssortmentActiveMutation = gql`
  mutation BulkSetAssortmentActive(
    $assortmentIds: [ID!]!
    $isActive: Boolean!
  ) {
    bulkSetAssortmentActive(
      assortmentIds: $assortmentIds
      isActive: $isActive
    ) {
      successCount
      failedCount
      failedIds
    }
  }
`;

const refetchQueries = ['Assortments', 'AssortmentsCount'];

const useBulkAssortmentOperations = () => {
  const [bulkRemoveMutation] = useMutation(BulkRemoveAssortmentsMutation);
  const [bulkUpdateTagsMutation] = useMutation(
    BulkUpdateAssortmentTagsMutation,
  );
  const [bulkSetActiveMutation] = useMutation(BulkSetAssortmentActiveMutation);

  return {
    bulkRemoveAssortments: (assortmentIds: string[]) =>
      bulkRemoveMutation({
        variables: { assortmentIds },
        refetchQueries,
      }),

    bulkUpdateAssortmentTags: (
      assortmentIds: string[],
      add?: string[],
      remove?: string[],
    ) =>
      bulkUpdateTagsMutation({
        variables: { assortmentIds, add, remove },
        refetchQueries,
      }),

    bulkSetAssortmentActive: (assortmentIds: string[], isActive: boolean) =>
      bulkSetActiveMutation({
        variables: { assortmentIds, isActive },
        refetchQueries,
      }),
  };
};

export default useBulkAssortmentOperations;
