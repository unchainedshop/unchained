import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { useAuth } from '@unchainedshop/admin-ui/hooks';

// The redeemed token updates the cached ticket, so lists show it as redeemed without a refetch.
const ScanTicketMutation = gql`
  mutation ScanTicket(
    $tokenId: ID!
    $productId: ID
    $accessKey: String
    $withContacts: Boolean = false
  ) {
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
        primaryEmail @include(if: $withContacts) {
          address
        }
        lastContact @include(if: $withContacts) {
          emailAddress
          telNumber
        }
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
  const withContacts = useAuth().hasRole('viewUserContactInfos');

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
      variables: {
        tokenId,
        productId: productId || null,
        accessKey: accessKey || null,
        withContacts,
      },
    });
    return data?.scanTicket;
  };
  return { scanTicket };
};

export default useScanTicket;
