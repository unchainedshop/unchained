import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';

const CancelTicketMutation = gql`
  mutation CancelTicket($tokenId: ID!, $generateDiscount: Boolean) {
    cancelTicket(tokenId: $tokenId, generateDiscount: $generateDiscount) {
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

  const cancelTicket = async ({
    tokenId,
    generateDiscount,
  }: {
    tokenId: string;
    generateDiscount?: boolean;
  }) => {
    const result = await cancelTicketMutation({
      variables: { tokenId, generateDiscount },
      refetchQueries: ['Product', 'TicketEvents', 'Tokens', 'Token'],
    });
    return result;
  };

  return { cancelTicket };
};

export default useCancelTicket;
