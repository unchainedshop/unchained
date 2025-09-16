import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IUpdateProductWarehousingMutation,
  IUpdateProductWarehousingMutationVariables,
} from '../../../gql/types';

const UpdateProductWarehousingMutation = gql`
  mutation UpdateProductWarehousing(
    $productId: ID!
    $warehousing: UpdateProductWarehousingInput!
  ) {
    updateProductWarehousing(productId: $productId, warehousing: $warehousing) {
      _id
      ... on SimpleProduct {
        sku
        baseUnit
      }
    }
  }
`;

const useUpdateProductWarehousing = () => {
  const [updateProductWarehousingMutation] = useMutation<
    IUpdateProductWarehousingMutation,
    IUpdateProductWarehousingMutationVariables
  >(UpdateProductWarehousingMutation);

  const updateProductWarehousing = async ({
    productId,
    warehousing: { sku = null, baseUnit = null },
  }: IUpdateProductWarehousingMutationVariables) => {
    return updateProductWarehousingMutation({
      variables: {
        productId,
        warehousing: {
          sku,
          baseUnit,
        },
      },
      refetchQueries: ['Products'],
    });
  };

  return {
    updateProductWarehousing,
  };
};

export default useUpdateProductWarehousing;
