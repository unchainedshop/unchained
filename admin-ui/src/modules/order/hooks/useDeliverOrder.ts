import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import {
  IDeliverOrderMutation,
  IDeliverOrderMutationVariables,
} from '../../../gql/types';

const DeliverOrderMutation = gql`
  mutation DeliverOrder($orderId: ID!) {
    deliverOrder(orderId: $orderId) {
      _id
    }
  }
`;

const useDeliverOrder = () => {
  const [deliverOrderMutation] = useMutation<
    IDeliverOrderMutation,
    IDeliverOrderMutationVariables
  >(DeliverOrderMutation);

  const deliverOrder = async ({ orderId }: IDeliverOrderMutationVariables) => {
    return deliverOrderMutation({
      variables: {
        orderId,
      },
      refetchQueries: ['Order'],
    });
  };

  return {
    deliverOrder,
  };
};

export default useDeliverOrder;
