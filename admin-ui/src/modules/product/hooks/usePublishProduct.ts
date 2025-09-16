import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IPublishProductMutation,
  IPublishProductMutationVariables,
} from '../../../gql/types';
import ProductDetailFragment from '../fragments/ProductDetailFragment';

const PublishProductMutation = gql`
  mutation PublishProduct($productId: ID!) {
    publishProduct(productId: $productId) {
      ...ProductDetailFragment
    }
  }
  ${ProductDetailFragment}
`;

const usePublishProduct = () => {
  const [publishProductMutation] = useMutation<
    IPublishProductMutation,
    IPublishProductMutationVariables
  >(PublishProductMutation);

  const publishProduct = async ({
    productId,
  }: IPublishProductMutationVariables) => {
    return publishProductMutation({
      variables: { productId },
      refetchQueries: ['Product', 'ShopStatus'],
      awaitRefetchQueries: true,
    });
  };

  return {
    publishProduct,
  };
};

export default usePublishProduct;
