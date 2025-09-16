import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IRemoveProductVariationMutation,
  IRemoveProductVariationMutationVariables,
} from '../../../gql/types';

const RemoveProductVariationMutation = gql`
  mutation RemoveProductVariation($productVariationId: ID!) {
    removeProductVariation(productVariationId: $productVariationId) {
      _id
    }
  }
`;

const useRemoveProductVariation = () => {
  const [removeProductVariationMutation] = useMutation<
    IRemoveProductVariationMutation,
    IRemoveProductVariationMutationVariables
  >(RemoveProductVariationMutation);

  const removeProductVariation = async ({
    productVariationId,
  }: IRemoveProductVariationMutationVariables) => {
    return removeProductVariationMutation({
      variables: { productVariationId },
      refetchQueries: ['ProductVariations'],
    });
  };

  return {
    removeProductVariation,
  };
};

export default useRemoveProductVariation;
