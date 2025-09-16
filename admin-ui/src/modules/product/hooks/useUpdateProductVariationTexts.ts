import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IUpdateProductVariationTextsMutation,
  IUpdateProductVariationTextsMutationVariables,
} from '../../../gql/types';

const UpdateProductVariationTextsMutation = gql`
  mutation UpdateProductVariationTexts(
    $productVariationId: ID!
    $productVariationOptionValue: String
    $texts: [ProductVariationTextInput!]!
  ) {
    updateProductVariationTexts(
      productVariationId: $productVariationId
      productVariationOptionValue: $productVariationOptionValue
      texts: $texts
    ) {
      _id
    }
  }
`;

const useUpdateProductVariationTexts = () => {
  const [updateProductVariationTextsMutation] = useMutation<
    IUpdateProductVariationTextsMutation,
    IUpdateProductVariationTextsMutationVariables
  >(UpdateProductVariationTextsMutation);

  const updateProductVariationTexts = async ({
    productVariationId,
    productVariationOptionValue,
    texts,
  }: IUpdateProductVariationTextsMutationVariables) => {
    return updateProductVariationTextsMutation({
      variables: {
        productVariationId,
        productVariationOptionValue,
        texts,
      },
      refetchQueries: ['ProductVariations'],
    });
  };

  return {
    updateProductVariationTexts,
  };
};

export default useUpdateProductVariationTexts;
