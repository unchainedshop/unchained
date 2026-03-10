import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';

const CancelTicketMutation = gql`
  mutation CancelTicket($tokenId: ID!) {
    cancelTicket(tokenId: $tokenId) {
      _id
      isCanceled
      invalidatedDate
      isInvalidateable
      tokenSerialNumber
    }
  }
`;

const useCancelTicket = () => {
  const [cancelTicketMutation] = useMutation(CancelTicketMutation);

  const cancelTicket = async ({ tokenId }: { tokenId: string }) => {
    const result = await cancelTicketMutation({
      variables: { tokenId },
      refetchQueries: ['Product', 'TicketEvents', 'Tokens', 'Token'],
    });
    return result;
  };

  return { cancelTicket };
};

export default useCancelTicket;
