import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IUpdateProductSupplyMutation,
  IUpdateProductSupplyMutationVariables,
} from '../../../gql/types';
import ProductDimensionFragment from '../fragments/ProductDimensionFragment';

const UpdateProductSupplyMutation = gql`
  mutation UpdateProductSupply(
    $productId: ID!
    $supply: UpdateProductSupplyInput!
  ) {
    updateProductSupply(productId: $productId, supply: $supply) {
      _id
      ... on SimpleProduct {
        dimensions {
          ...ProductDimensionFragment
        }
      }
    }
  }
  ${ProductDimensionFragment}
`;

const useUpdateProductSupply = () => {
  const [updateProductSupplyMutation] = useMutation<
    IUpdateProductSupplyMutation,
    IUpdateProductSupplyMutationVariables
  >(UpdateProductSupplyMutation);

  const updateProductSupply = async ({
    productId,
    supply: {
      weightInGram: weight = null,
      heightInMillimeters: height = null,
      lengthInMillimeters: length = null,
      widthInMillimeters: width = null,
    },
  }: IUpdateProductSupplyMutationVariables) => {
    return updateProductSupplyMutation({
      variables: {
        productId,
        supply: {
          weightInGram: weight || null,
          heightInMillimeters: height || null,
          lengthInMillimeters: length || null,
          widthInMillimeters: width || null,
        },
      },
      refetchQueries: ['Products'],
    });
  };

  return {
    updateProductSupply,
  };
};

export default useUpdateProductSupply;
