import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IUpdateProductCommerceMutation,
  IUpdateProductCommerceMutationVariables,
} from '../../../gql/types';
import ProductDetailFragment from '../fragments/ProductDetailFragment';
import useCurrencies from '../../currency/hooks/useCurrencies';
import { toMinorUnit } from '../utils/price.utils';

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
  const { currencies } = useCurrencies();

  const updateProductCommerce = async ({
    productId,
    commerce: { pricing },
  }: IUpdateProductCommerceMutationVariables) => {
    const normalizedPricing = pricing.map((price) => {
      const currency = currencies.find(
        ({ isoCode }) => isoCode === price.currencyCode,
      );
      const amount = toMinorUnit(price.amount.toString(), currency.decimals);
      return {
        ...price,
        amount,
      };
    });

    return updateProductCommerceMutation({
      variables: {
        productId,
        commerce: {
          pricing: normalizedPricing,
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
