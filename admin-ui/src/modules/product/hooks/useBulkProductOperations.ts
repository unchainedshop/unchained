import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';

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
  const [bulkSetStatusMutation] = useMutation(BulkSetProductStatusMutation);
  const [bulkUpdateTagsMutation] = useMutation(BulkUpdateProductTagsMutation);
  const [bulkRemoveMutation] = useMutation(BulkRemoveProductsMutation);
  const [bulkAssignToAssortmentMutation] = useMutation(
    BulkAssignProductsToAssortmentMutation,
  );

  return {
    bulkSetProductStatus: (productIds: string[], status: string) =>
      bulkSetStatusMutation({
        variables: { productIds, status },
        refetchQueries,
      }),

    bulkUpdateProductTags: (
      productIds: string[],
      add?: string[],
      remove?: string[],
    ) =>
      bulkUpdateTagsMutation({
        variables: { productIds, add, remove },
        refetchQueries,
      }),

    bulkRemoveProducts: (productIds: string[]) =>
      bulkRemoveMutation({
        variables: { productIds },
        refetchQueries,
      }),

    bulkAssignProductsToAssortment: (
      productIds: string[],
      assortmentId: string,
    ) =>
      bulkAssignToAssortmentMutation({
        variables: { productIds, assortmentId },
        refetchQueries,
      }),
  };
};

export default useBulkProductOperations;
