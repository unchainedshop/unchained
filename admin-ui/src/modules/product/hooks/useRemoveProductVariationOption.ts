import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IRemoveProductVariationOptionMutation,
  IRemoveProductVariationOptionMutationVariables,
} from '../../../gql/types';

const RemoveProductVariationOptionMutation = gql`
  mutation RemoveProductVariationOption(
    $productVariationId: ID!
    $productVariationOptionValue: String!
  ) {
    removeProductVariationOption(
      productVariationId: $productVariationId
      productVariationOptionValue: $productVariationOptionValue
    ) {
      _id
    }
  }
`;

const useRemoveProductVariationOption = () => {
  const [removeProductVariationOptionMutation] = useMutation<
    IRemoveProductVariationOptionMutation,
    IRemoveProductVariationOptionMutationVariables
  >(RemoveProductVariationOptionMutation);

  const removeProductVariationOption = async ({
    productVariationId,
    productVariationOptionValue,
  }: IRemoveProductVariationOptionMutationVariables) => {
    return removeProductVariationOptionMutation({
      variables: { productVariationId, productVariationOptionValue },
      refetchQueries: ['ProductVariations'],
    });
  };

  return {
    removeProductVariationOption,
  };
};

export default useRemoveProductVariationOption;
