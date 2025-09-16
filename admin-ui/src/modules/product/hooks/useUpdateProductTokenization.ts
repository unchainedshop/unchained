import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IUpdateProductTokenizationMutation,
  IUpdateProductTokenizationMutationVariables,
} from '../../../gql/types';

const UpdateProductTokenizationMutation = gql`
  mutation UpdateProductTokenization(
    $productId: ID!
    $tokenization: UpdateProductTokenizationInput!
  ) {
    updateProductTokenization(
      productId: $productId
      tokenization: $tokenization
    ) {
      _id
    }
  }
`;

const useUpdateProductTokenization = () => {
  const [updateProductTokenizationMutation] = useMutation<
    IUpdateProductTokenizationMutation,
    IUpdateProductTokenizationMutationVariables
  >(UpdateProductTokenizationMutation);

  const updateProductTokenization = async ({
    productId,
    tokenization: { contractAddress, contractStandard, tokenId, supply },
  }: IUpdateProductTokenizationMutationVariables) => {
    return updateProductTokenizationMutation({
      variables: {
        productId,
        tokenization: {
          contractAddress,
          contractStandard,
          tokenId,
          supply: parseInt(supply as unknown as string, 10),
        },
      },
      refetchQueries: ['Product', 'Products'],
    });
  };

  return {
    updateProductTokenization,
  };
};

export default useUpdateProductTokenization;
