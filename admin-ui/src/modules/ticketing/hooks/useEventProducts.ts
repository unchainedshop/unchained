import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

const TicketEventsQuery = gql`
  query TicketEvents(
    $queryString: String
    $limit: Int
    $offset: Int
    $includeDrafts: Boolean = true
    $forceLocale: Locale
  ) {
    ticketEvents(
      queryString: $queryString
      limit: $limit
      offset: $offset
      includeDrafts: $includeDrafts
    ) {
      _id
      status
      tags
      updated
      published
      ... on TokenizedProduct {
        texts(forceLocale: $forceLocale) {
          _id
          slug
          title
          subtitle
          description
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
          ercMetadataProperties
          supply
        }
        simulatedStocks {
          quantity
        }
        tokensCount
      }
    }
    ticketEventsCount(includeDrafts: $includeDrafts, queryString: $queryString)
  }
`;

const useEventProducts = ({
  queryString = null,
  limit = 50,
  offset = 0,
}: {
  queryString?: string;
  limit?: number;
  offset?: number;
}) => {
  const { data, loading, error } = useQuery<any>(TicketEventsQuery, {
    variables: { queryString, limit, offset },
  });

  return {
    products: data?.ticketEvents || [],
    productsCount: data?.ticketEventsCount || 0,
    loading,
    error,
  };
};

export default useEventProducts;
