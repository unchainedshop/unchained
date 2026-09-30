import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { EVENT_START_SORT_KEY } from '../utils/dates.ts';
import useRefetchWhenVisible, { pollWhileVisible } from './useRefetchWhenVisible.ts';

// No tickets here: the picker only needs the events, the gate loads tickets of the chosen one.
// DateTime arguments are served as the DateTimeISO scalar, so the variables are declared as such.
const GateEventsQuery = gql`
  query GateEvents(
    $onlyInvalidateable: Boolean!
    $slotFrom: DateTimeISO
    $slotTo: DateTimeISO
    $sort: [SortOptionInput!]
    $limit: Int
  ) {
    ticketEvents(
      limit: $limit
      includeDrafts: false
      onlyInvalidateable: $onlyInvalidateable
      slotFrom: $slotFrom
      slotTo: $slotTo
      sort: $sort
    ) {
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
        tokensCount
      }
    }
  }
`;

const EVENT_START_ASC = [
  { key: EVENT_START_SORT_KEY, value: 'ASC' },
  { key: '_id', value: 'ASC' },
];

/**
 * Active ticket events starting between slotFrom and slotTo, soonest first. onlyInvalidateable
 * keeps the events with a ticket that can be redeemed now (entry window open). Polls while the
 * page is visible and not skipped (an event is picked).
 */
const useGateEvents = ({
  onlyInvalidateable = false,
  slotFrom,
  slotTo,
  skip = false,
}: {
  onlyInvalidateable?: boolean;
  slotFrom?: string;
  slotTo?: string;
  skip?: boolean;
}) => {
  const { data, loading, error, refetch, previousData } = useQuery<any>(GateEventsQuery, {
    variables: { onlyInvalidateable, slotFrom, slotTo, sort: EVENT_START_ASC, limit: 50 },
    skip,
    fetchPolicy: 'cache-and-network',
    ...pollWhileVisible(skip ? 0 : 60000),
  });
  useRefetchWhenVisible(() => !skip && refetch());

  return {
    events: (data?.ticketEvents || previousData?.ticketEvents || []) as any[],
    loading,
    error,
    refetch,
  };
};

export default useGateEvents;
