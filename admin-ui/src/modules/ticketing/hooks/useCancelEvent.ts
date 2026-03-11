import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';

const CancelEventMutation = gql`
  mutation CancelEvent($productId: ID!, $generateDiscount: Boolean) {
    cancelEvent(productId: $productId, generateDiscount: $generateDiscount)
  }
`;

const useCancelEvent = () => {
  const [cancelEventMutation] = useMutation(CancelEventMutation);

  const cancelEvent = async ({
    productId,
    generateDiscount,
  }: {
    productId: string;
    generateDiscount?: boolean;
  }) => {
    const result = await cancelEventMutation({
      variables: { productId, generateDiscount },
      refetchQueries: ['Product', 'TicketEvents', 'Tokens'],
    });
    return result;
  };

  return { cancelEvent };
};

export default useCancelEvent;
