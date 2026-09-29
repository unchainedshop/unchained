import { useCallback } from 'react';
import { gql } from '@apollo/client';
import { useApolloClient } from '@apollo/client/react';

const TicketLookupQuery = gql`
  query TicketLookup($code: String!, $productId: ID, $limit: Int) {
    ticketLookup(code: $code, productId: $productId, limit: $limit) {
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
        isCanceled
        eventStartsAt
        eventCategory
        texts {
          _id
          title
        }
      }
    }
  }
`;

/**
 * Resolves a scanned QR payload or a typed code: ticket id, serial or attendee name within
 * productId, or an order number. Returns cancelled and redeemed tickets too, and tickets of other
 * events for ids and order numbers; rejects with the GraphQL error.
 */
const useTicketLookup = () => {
  const client = useApolloClient();

  const lookupTickets = useCallback(
    async ({
      code,
      productId,
      limit = 10,
    }: {
      code: string;
      productId?: string | null;
      limit?: number;
    }) => {
      const { data } = await client.query<any>({
        query: TicketLookupQuery,
        variables: { code, productId: productId || null, limit },
        fetchPolicy: 'network-only',
      });
      return (data?.ticketLookup || []) as any[];
    },
    [client],
  );

  return { lookupTickets };
};

export default useTicketLookup;
