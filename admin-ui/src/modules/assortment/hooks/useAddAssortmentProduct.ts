import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IAddAssortmentProductMutation,
  IAddAssortmentProductMutationVariables,
} from '../../../gql/types';

const AddAssortmentProductMutation = gql`
  mutation AddAssortmentProduct(
    $assortmentId: ID!
    $productId: ID!
    $tags: [LowerCaseString!]
  ) {
    addAssortmentProduct(
      assortmentId: $assortmentId
      productId: $productId
      tags: $tags
    ) {
      _id
    }
  }
`;

const useAddAssortmentProduct = () => {
  const [addAssortmentProductMutation] = useMutation<
    IAddAssortmentProductMutation,
    IAddAssortmentProductMutationVariables
  >(AddAssortmentProductMutation);

  const addAssortmentProduct = async ({
    productId,
    assortmentId,
    tags,
  }: IAddAssortmentProductMutationVariables) => {
    return addAssortmentProductMutation({
      variables: { productId, assortmentId, tags },
      refetchQueries: ['AssortmentProducts'],
    });
  };

  return {
    addAssortmentProduct,
  };
};

export default useAddAssortmentProduct;
