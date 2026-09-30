import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

// DateTime arguments are served as the DateTimeISO scalar, so the variables are declared as such.
const TicketEventsQuery = gql`
  query TicketEvents(
    $queryString: String
    $limit: Int
    $offset: Int
    $includeDrafts: Boolean = true
    $sort: [SortOptionInput!]
    $slotFrom: DateTimeISO
    $slotTo: DateTimeISO
    $forceLocale: Locale
    $standalone: Boolean
  ) {
    ticketEvents(
      queryString: $queryString
      limit: $limit
      offset: $offset
      includeDrafts: $includeDrafts
      sort: $sort
      slotFrom: $slotFrom
      slotTo: $slotTo
      standalone: $standalone
    ) {
      _id
      status
      tags
      ... on TokenizedProduct {
        texts(forceLocale: $forceLocale) {
          _id
          slug
          title
          subtitle
        }
        media(limit: 1) {
          _id
          file {
            _id
            url
            name
          }
        }
        contractConfiguration {
          supply
        }
        simulatedStocks {
          quantity
        }
        tokensCount
        event {
          isCanceled
          startsAt
          location
          category
        }
      }
    }
    ticketEventsCount(
      includeDrafts: $includeDrafts
      queryString: $queryString
      slotFrom: $slotFrom
      slotTo: $slotTo
      standalone: $standalone
    )
  }
`;

/** One page of ticket events; slotFrom/slotTo filter and sort order by event start, standalone leaves the performances of productions out. */
const useEventProducts = ({
  queryString = null,
  limit = 50,
  offset = 0,
  slotFrom,
  slotTo,
  sort,
  standalone = null,
}: {
  queryString?: string;
  limit?: number;
  offset?: number;
  slotFrom?: string;
  slotTo?: string;
  sort?: { key: string; value: string }[];
  standalone?: boolean | null;
}) => {
  const { data, loading, error } = useQuery<any>(TicketEventsQuery, {
    variables: { queryString, limit, offset, slotFrom, slotTo, sort, standalone },
  });

  return {
    products: data?.ticketEvents || [],
    productsCount: data?.ticketEventsCount || 0,
    loading,
    error,
  };
};

export default useEventProducts;
