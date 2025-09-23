import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IUpdateProductMutation,
  IUpdateProductMutationVariables,
} from '../../../gql/types';
import ProductDetailFragment from '../fragments/ProductDetailFragment';

const UpdateProductMutation = gql`
  mutation UpdateProduct($productId: ID!, $product: UpdateProductInput!) {
    updateProduct(productId: $productId, product: $product) {
      ...ProductDetailFragment
    }
  }
  ${ProductDetailFragment}
`;

const useUpdateProduct = () => {
  const [updateProductMutation] = useMutation<
    IUpdateProductMutation,
    IUpdateProductMutationVariables
  >(UpdateProductMutation);

  const updateProduct = async ({
    productId,
    product: { tags, sequence, meta },
  }: IUpdateProductMutationVariables) => {
    return updateProductMutation({
      variables: {
        productId,
        product: {
          tags,
          sequence,
          meta,
        },
      },
      refetchQueries: ['Products', 'ShopStatus', 'ShopInfo'],
    });
  };

  return {
    updateProduct,
  };
};

export default useUpdateProduct;
