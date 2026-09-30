import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';

// The redeemed token updates the cached ticket, so lists show it as redeemed without a refetch.
const ScanTicketMutation = gql`
  mutation ScanTicket($tokenId: ID!, $productId: ID, $accessKey: String) {
    scanTicket(tokenId: $tokenId, productId: $productId, accessKey: $accessKey) {
      _id
      tokenSerialNumber
      quantity
      ticketStatus
      invalidatedDate
      cancelledDate
      isInvalidateable
      attendeeName
      user {
        _id
        name
      }
      product {
        _id
        status
        event {
          isCanceled
          startsAt
          category
        }
        texts {
          _id
          title
        }
      }
    }
  }
`;

/**
 * Redeems a ticket at the gate. productId is the event the gate admits the ticket for: tickets of
 * other events are refused with TicketWrongEventError. Refusals reject with the GraphQL error, see
 * describeScanError.
 */
const useScanTicket = () => {
  const [scanTicketMutation] = useMutation<any>(ScanTicketMutation);

  const scanTicket = async ({
    tokenId,
    productId,
    accessKey,
  }: {
    tokenId: string;
    productId?: string | null;
    accessKey?: string | null;
  }) => {
    const { data } = await scanTicketMutation({
      variables: { tokenId, productId: productId || null, accessKey: accessKey || null },
    });
    return data?.scanTicket;
  };
  return { scanTicket };
};

export default useScanTicket;
