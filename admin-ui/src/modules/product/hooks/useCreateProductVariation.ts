import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  ICreateProductVariationMutation,
  ICreateProductVariationMutationVariables,
} from '../../../gql/types';

const CreateProductVariationMutation = gql`
  mutation CreateProductVariation(
    $productId: ID!
    $variation: CreateProductVariationInput!
    $texts: [ProductVariationTextInput!]
  ) {
    createProductVariation(
      productId: $productId
      variation: $variation
      texts: $texts
    ) {
      _id
    }
  }
`;

const useCreateProductVariation = () => {
  const [createProductVariationMutation] = useMutation<
    ICreateProductVariationMutation,
    ICreateProductVariationMutationVariables
  >(CreateProductVariationMutation);

  const createProductVariation = async ({
    productId,
    variation: { key, type },
    texts,
  }: ICreateProductVariationMutationVariables) => {
    return createProductVariationMutation({
      variables: { productId, variation: { key, type }, texts },
      refetchQueries: ['ProductVariations'],
    });
  };

  return {
    createProductVariation,
  };
};

export default useCreateProductVariation;
