import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IAddProductAssignmentMutation,
  IAddProductAssignmentMutationVariables,
} from '../../../gql/types';

const AddProductAssignmentMutation = gql`
  mutation AddProductAssignment(
    $proxyId: ID!
    $productId: ID!
    $vectors: [ProductAssignmentVectorInput!]!
  ) {
    addProductAssignment(
      proxyId: $proxyId
      productId: $productId
      vectors: $vectors
    ) {
      _id
    }
  }
`;

const useAddProductAssignment = () => {
  const [addProductAssignmentMutation] = useMutation<
    IAddProductAssignmentMutation,
    IAddProductAssignmentMutationVariables
  >(AddProductAssignmentMutation);

  const addProductAssignment = async ({
    productId,
    proxyId,
    vectors,
  }: IAddProductAssignmentMutationVariables) => {
    return addProductAssignmentMutation({
      variables: { productId, proxyId, vectors },
      refetchQueries: ['ProductAssignments'],
    });
  };

  return {
    addProductAssignment,
  };
};

export default useAddProductAssignment;
