import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';

const CancelEventMutation = gql`
  mutation CancelEvent($productId: ID!) {
    cancelEvent(productId: $productId)
  }
`;

const useCancelEvent = () => {
  const [cancelEventMutation] = useMutation(CancelEventMutation);

  const cancelEvent = async ({ productId }: { productId: string }) => {
    const result = await cancelEventMutation({
      variables: { productId },
      refetchQueries: ['Product', 'TicketEvents', 'Tokens'],
    });
    return result;
  };

  return { cancelEvent };
};

export default useCancelEvent;
