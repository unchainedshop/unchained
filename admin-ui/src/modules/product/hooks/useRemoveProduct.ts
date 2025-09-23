import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IRemoveProductMutation,
  IRemoveProductMutationVariables,
} from '../../../gql/types';

const RemoveProductMutation = gql`
  mutation RemoveProduct($productId: ID!) {
    removeProduct(productId: $productId) {
      _id
    }
  }
`;

const useRemoveProduct = () => {
  const [removeProductMutation] = useMutation<
    IRemoveProductMutation,
    IRemoveProductMutationVariables
  >(RemoveProductMutation);

  const removeProduct = async ({
    productId,
  }: IRemoveProductMutationVariables) => {
    return removeProductMutation({
      variables: { productId },
      refetchQueries: ['Products', 'ShopStatus', 'ShopInfo'],
    });
  };

  return {
    removeProduct,
  };
};

export default useRemoveProduct;
