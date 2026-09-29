import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';

const ScanTicketMutation = gql`
  mutation ScanTicket($tokenId: ID!) {
    scanTicket(tokenId: $tokenId) {
      _id
      invalidatedDate
      isInvalidateable
    }
  }
`;

const useInvalidateTicket = () => {
  const [scanTicketMutation] = useMutation(ScanTicketMutation);

  const invalidateTicket = async ({ tokenId }) => {
    return scanTicketMutation({
      variables: { tokenId },
    });
  };
  return { invalidateTicket };
};

export default useInvalidateTicket;
