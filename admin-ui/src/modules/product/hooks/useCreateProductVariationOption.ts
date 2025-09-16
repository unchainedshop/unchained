import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  ICreateProductVariationOptionMutation,
  ICreateProductVariationOptionMutationVariables,
} from '../../../gql/types';

const CreateProductVariationOptionMutation = gql`
  mutation CreateProductVariationOption(
    $productVariationId: ID!
    $option: String!
    $texts: [ProductVariationTextInput!]
  ) {
    createProductVariationOption(
      productVariationId: $productVariationId
      option: $option
      texts: $texts
    ) {
      _id
    }
  }
`;

const useCreateProductVariationOption = () => {
  const [createProductVariationOptionMutation] = useMutation<
    ICreateProductVariationOptionMutation,
    ICreateProductVariationOptionMutationVariables
  >(CreateProductVariationOptionMutation);

  const createProductVariationOption = async ({
    productVariationId,
    option,
    texts,
  }: ICreateProductVariationOptionMutationVariables) => {
    return createProductVariationOptionMutation({
      variables: { productVariationId, option, texts },
      refetchQueries: ['ProductVariations', 'Product'],
    });
  };

  return {
    createProductVariationOption,
  };
};

export default useCreateProductVariationOption;
