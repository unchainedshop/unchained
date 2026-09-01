import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IBulkAssignProductsToAssortmentMutation,
  IBulkAssignProductsToAssortmentMutationVariables,
  IBulkRemoveProductsMutation,
  IBulkRemoveProductsMutationVariables,
  IBulkSetProductStatusMutation,
  IBulkSetProductStatusMutationVariables,
  IBulkUpdateProductTagsMutation,
  IBulkUpdateProductTagsMutationVariables,
  IProductStatus,
} from '../../../gql/types';

const BulkSetProductStatusMutation = gql`
  mutation BulkSetProductStatus($productIds: [ID!]!, $status: ProductStatus!) {
    bulkSetProductStatus(productIds: $productIds, status: $status) {
      successCount
      failedCount
      failedIds
    }
  }
`;

const BulkUpdateProductTagsMutation = gql`
  mutation BulkUpdateProductTags(
    $productIds: [ID!]!
    $add: [LowerCaseString!]
    $remove: [LowerCaseString!]
  ) {
    bulkUpdateProductTags(productIds: $productIds, add: $add, remove: $remove) {
      successCount
      failedCount
      failedIds
    }
  }
`;

const BulkRemoveProductsMutation = gql`
  mutation BulkRemoveProducts($productIds: [ID!]!) {
    bulkRemoveProducts(productIds: $productIds) {
      successCount
      failedCount
      failedIds
    }
  }
`;

const BulkAssignProductsToAssortmentMutation = gql`
  mutation BulkAssignProductsToAssortment(
    $productIds: [ID!]!
    $assortmentId: ID!
  ) {
    bulkAssignProductsToAssortment(
      productIds: $productIds
      assortmentId: $assortmentId
    ) {
      successCount
      failedCount
      failedIds
    }
  }
`;

const refetchQueries = ['Products', 'ProductsCount', 'ShopStatus', 'ShopInfo'];

const useBulkProductOperations = () => {
  const [bulkSetStatusMutation] = useMutation<
    IBulkSetProductStatusMutation,
    IBulkSetProductStatusMutationVariables
  >(BulkSetProductStatusMutation);
  const [bulkUpdateTagsMutation] = useMutation<
    IBulkUpdateProductTagsMutation,
    IBulkUpdateProductTagsMutationVariables
  >(BulkUpdateProductTagsMutation);
  const [bulkRemoveMutation] = useMutation<
    IBulkRemoveProductsMutation,
    IBulkRemoveProductsMutationVariables
  >(BulkRemoveProductsMutation);
  const [bulkAssignToAssortmentMutation] = useMutation<
    IBulkAssignProductsToAssortmentMutation,
    IBulkAssignProductsToAssortmentMutationVariables
  >(BulkAssignProductsToAssortmentMutation);

  return {
    bulkSetProductStatus: (productIds: string[], status: IProductStatus) =>
      bulkSetStatusMutation({
        variables: { productIds, status },
        refetchQueries,
        awaitRefetchQueries: true,
      }),

    bulkUpdateProductTags: (
      productIds: string[],
      add?: string[],
      remove?: string[],
    ) =>
      bulkUpdateTagsMutation({
        variables: { productIds, add, remove },
        refetchQueries,
        awaitRefetchQueries: true,
      }),

    bulkRemoveProducts: (productIds: string[]) =>
      bulkRemoveMutation({
        variables: { productIds },
        refetchQueries,
        awaitRefetchQueries: true,
      }),

    bulkAssignProductsToAssortment: (
      productIds: string[],
      assortmentId: string,
    ) =>
      bulkAssignToAssortmentMutation({
        variables: { productIds, assortmentId },
        refetchQueries,
        awaitRefetchQueries: true,
      }),
  };
};

export default useBulkProductOperations;
