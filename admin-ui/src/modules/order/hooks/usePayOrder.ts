import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IPayOrderMutation,
  IPayOrderMutationVariables,
} from '../../../gql/types';

const PayOrderMutation = gql`
  mutation PayOrder($orderId: ID!) {
    payOrder(orderId: $orderId) {
      _id
    }
  }
`;

const usePayOrder = () => {
  const [payOrderMutation] = useMutation<
    IPayOrderMutation,
    IPayOrderMutationVariables
  >(PayOrderMutation);

  const payOrder = async ({ orderId }: IPayOrderMutationVariables) => {
    return payOrderMutation({
      variables: {
        orderId,
      },
      refetchQueries: ['Order'],
    });
  };

  return {
    payOrder,
  };
};

export default usePayOrder;
