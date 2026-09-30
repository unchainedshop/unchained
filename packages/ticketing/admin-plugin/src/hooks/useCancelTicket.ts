import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';

const CancelTicketMutation = gql`
  mutation CancelTicket($tokenId: ID!, $generateDiscount: Boolean) {
    cancelTicket(tokenId: $tokenId, generateDiscount: $generateDiscount) {
      _id
      tokenSerialNumber
      isCanceled
      ticketStatus
      invalidatedDate
      cancelledDate
    }
  }
`;

const useCancelTicket = () => {
  const [cancelTicketMutation] = useMutation(CancelTicketMutation);

  const cancelTicket = async ({
    tokenId,
    generateDiscount,
  }: {
    tokenId: string;
    generateDiscount?: boolean;
  }) => {
    // The cached ticket updates from the result; the refetch brings the stock and counters.
    const result = await cancelTicketMutation({
      variables: { tokenId, generateDiscount },
      refetchQueries: ['TicketEventDetail', 'GateEventDetail'],
      awaitRefetchQueries: true,
    });
    return result;
  };

  return { cancelTicket };
};

export default useCancelTicket;
