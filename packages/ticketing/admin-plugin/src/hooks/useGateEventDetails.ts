import { useMemo } from 'react';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { batchQuery, batchResults, batchVariables } from '../utils/query.ts';
import useRefetchWhenVisible, { pollWhileVisible } from './useRefetchWhenVisible.ts';

// Only what the gate list shows: no per-ticket redeemability check, which would ask the
// warehousing adapter once per ticket on every poll. scanTicket decides when redeeming.
const GateEventDetailQuery = gql`
  query GateEventDetail($productId: ID!) {
    product(productId: $productId) {
      _id
      status
      ... on TokenizedProduct {
        texts {
          _id
          title
          subtitle
        }
        event {
          startsAt
          location
          category
          isCanceled
        }
        tokens {
          _id
          tokenSerialNumber
          quantity
          ticketStatus
          invalidatedDate
          cancelledDate
          attendeeName
          user {
            _id
            name
          }
        }
      }
    }
  }
`;

/**
 * The events a gate admits, with their tickets, in the order of productIds: GateEventDetail
 * batched into one request, so a gate for several events polls as often as one for a single
 * event. Events that cannot be loaded are left out.
 */
const useGateEventDetails = (productIds: string[]) => {
  const count = productIds.length;
  const query = useMemo(() => batchQuery(GateEventDetailQuery, Math.max(count, 1)), [count]);
  const { data, loading, error, refetch, previousData } = useQuery<any>(query, {
    variables: batchVariables(productIds.map((productId) => ({ productId }))),
    skip: !count,
    fetchPolicy: 'cache-and-network',
    ...pollWhileVisible(15000),
  });
  useRefetchWhenVisible(() => count && refetch());

  // previousData bridges refetches of the same events, never shows other events.
  const ids = productIds.join(',');
  const events = useMemo(() => {
    const expected = ids ? ids.split(',') : [];
    return batchResults(data || previousData, expected.length).filter(
      (event, index) => event?._id === expected[index],
    );
  }, [data, previousData, ids]);

  return { events: events as any[], loading, error, refetch };
};

export default useGateEventDetails;
