import { useCallback } from 'react';
import { gql } from '@apollo/client';
import { useApolloClient } from '@apollo/client/react';
import { useAuth } from '@unchainedshop/admin-ui/hooks';

const TicketLookupQuery = gql`
  query TicketLookup($code: String!, $productId: ID, $limit: Int, $withContacts: Boolean = false) {
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
 * Resolves a scanned QR payload or a typed code: ticket id, serial or attendee name within
 * productId, or an order number. Returns cancelled and redeemed tickets too, and tickets of other
 * events for ids and order numbers; rejects with the GraphQL error.
 */
const useTicketLookup = () => {
  const client = useApolloClient();
  // Buyer e-mail and phone only for viewers who may see them
  const withContacts = useAuth().hasRole('viewUserContactInfos');

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
        variables: { code, productId: productId || null, limit, withContacts },
        fetchPolicy: 'network-only',
      });
      return (data?.ticketLookup || []) as any[];
    },
    [client, withContacts],
  );

  return { lookupTickets };
};

export default useTicketLookup;
