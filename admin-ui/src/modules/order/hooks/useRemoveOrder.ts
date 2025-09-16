import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IRemoveOrderMutation,
  IRemoveOrderMutationVariables,
} from '../../../gql/types';

const RemoveOrderMutation = gql`
  mutation RemoveOrder($orderId: ID!) {
    removeOrder(orderId: $orderId) {
      _id
    }
  }
`;

const useRemoveOrder = () => {
  const [removeOrderMutation] = useMutation<
    IRemoveOrderMutation,
    IRemoveOrderMutationVariables
  >(RemoveOrderMutation);

  const removeOrder = async ({ orderId }: IRemoveOrderMutationVariables) => {
    return removeOrderMutation({
      variables: {
        orderId,
      },
      refetchQueries: ['Order'],
    });
  };

  return {
    removeOrder,
  };
};

export default useRemoveOrder;
