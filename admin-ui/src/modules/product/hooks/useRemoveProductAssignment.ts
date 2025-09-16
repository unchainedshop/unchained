import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IRemoveProductAssignmentMutation,
  IRemoveProductAssignmentMutationVariables,
} from '../../../gql/types';

const RemoveProductAssignmentMutation = gql`
  mutation RemoveProductAssignment(
    $proxyId: ID!
    $vectors: [ProductAssignmentVectorInput!]!
  ) {
    removeProductAssignment(proxyId: $proxyId, vectors: $vectors) {
      _id
    }
  }
`;

const useRemoveProductAssignment = () => {
  const [removeProductAssignmentMutation] = useMutation<
    IRemoveProductAssignmentMutation,
    IRemoveProductAssignmentMutationVariables
  >(RemoveProductAssignmentMutation);

  const removeProductAssignment = async ({
    proxyId,
    vectors,
  }: IRemoveProductAssignmentMutationVariables) => {
    return removeProductAssignmentMutation({
      variables: { proxyId, vectors },
      refetchQueries: ['ProductAssignments'],
    });
  };

  return {
    removeProductAssignment,
  };
};

export default useRemoveProductAssignment;
