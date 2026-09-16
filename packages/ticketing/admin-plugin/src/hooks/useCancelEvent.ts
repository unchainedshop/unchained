import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { TicketEventDetailQuery } from './useEventProduct';

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
      refetchQueries: [
        { query: TicketEventDetailQuery, variables: { productId } },
        'Product',
        'TicketEvents',
        'Tokens',
        'GateEvents',
        'GateEventDetail',
      ],
      awaitRefetchQueries: true,
    });
    return result;
  };

  return { cancelEvent };
};

export default useCancelEvent;
