import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IConfirmOrderMutation,
  IConfirmOrderMutationVariables,
} from '../../../gql/types';

const ConfirmOrderMutation = gql`
  mutation ConfirmOrder($orderId: ID!) {
    confirmOrder(orderId: $orderId) {
      _id
    }
  }
`;

const useConfirmOrder = () => {
  const [confirmOrderMutation] = useMutation<
    IConfirmOrderMutation,
    IConfirmOrderMutationVariables
  >(ConfirmOrderMutation);

  const confirmOrder = async ({ orderId }: IConfirmOrderMutationVariables) => {
    return confirmOrderMutation({
      variables: {
        orderId,
      },
      refetchQueries: ['Order'],
    });
  };

  return {
    confirmOrder,
  };
};

export default useConfirmOrder;
