import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IBulkRemoveAssortmentsMutation,
  IBulkRemoveAssortmentsMutationVariables,
  IBulkSetAssortmentActiveMutation,
  IBulkSetAssortmentActiveMutationVariables,
  IBulkUpdateAssortmentTagsMutation,
  IBulkUpdateAssortmentTagsMutationVariables,
} from '../../../gql/types';

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
  const [bulkRemoveMutation] = useMutation<
    IBulkRemoveAssortmentsMutation,
    IBulkRemoveAssortmentsMutationVariables
  >(BulkRemoveAssortmentsMutation);
  const [bulkUpdateTagsMutation] = useMutation<
    IBulkUpdateAssortmentTagsMutation,
    IBulkUpdateAssortmentTagsMutationVariables
  >(BulkUpdateAssortmentTagsMutation);
  const [bulkSetActiveMutation] = useMutation<
    IBulkSetAssortmentActiveMutation,
    IBulkSetAssortmentActiveMutationVariables
  >(BulkSetAssortmentActiveMutation);

  return {
    bulkRemoveAssortments: (assortmentIds: string[]) =>
      bulkRemoveMutation({
        variables: { assortmentIds },
        refetchQueries,
        awaitRefetchQueries: true,
      }),

    bulkUpdateAssortmentTags: (
      assortmentIds: string[],
      add?: string[],
      remove?: string[],
    ) =>
      bulkUpdateTagsMutation({
        variables: { assortmentIds, add, remove },
        refetchQueries,
        awaitRefetchQueries: true,
      }),

    bulkSetAssortmentActive: (assortmentIds: string[], isActive: boolean) =>
      bulkSetActiveMutation({
        variables: { assortmentIds, isActive },
        refetchQueries,
        awaitRefetchQueries: true,
      }),
  };
};

export default useBulkAssortmentOperations;
