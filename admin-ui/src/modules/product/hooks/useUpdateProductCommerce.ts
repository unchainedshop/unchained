import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IUpdateProductCommerceMutation,
  IUpdateProductCommerceMutationVariables,
} from '../../../gql/types';
import ProductDetailFragment from '../fragments/ProductDetailFragment';
import useApp from '../../common/hooks/useApp';
import { toPricingInput } from '../utils/price.utils';

const UpdateProductCommerceMutation = gql`
  mutation UpdateProductCommerce(
    $productId: ID!
    $commerce: UpdateProductCommerceInput!
  ) {
    updateProductCommerce(productId: $productId, commerce: $commerce) {
      ...ProductDetailFragment
    }
  }
  ${ProductDetailFragment}
`;

const useUpdateProductCommerce = () => {
  const [updateProductCommerceMutation] = useMutation<
    IUpdateProductCommerceMutation,
    IUpdateProductCommerceMutationVariables
  >(UpdateProductCommerceMutation);
  const { currencies } = useApp();

  const updateProductCommerce = async ({
    productId,
    commerce: { pricing },
  }: IUpdateProductCommerceMutationVariables) => {
    return updateProductCommerceMutation({
      variables: {
        productId,
        commerce: {
          pricing: toPricingInput(pricing, currencies),
        },
      },
      refetchQueries: ['Products'],
    });
  };

  return {
    updateProductCommerce,
  };
};

export default useUpdateProductCommerce;
