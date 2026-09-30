import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

// Only what the list shows: no performances and no tickets.
const TicketProductionsQuery = gql`
  query TicketProductions($limit: Int, $offset: Int, $queryString: String) {
    ticketProductions(limit: $limit, offset: $offset, queryString: $queryString) {
      _id
      status
      tags
      texts {
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
        }
      }
      ... on ConfigurableProduct {
        ticketProduction {
          location
          categories {
            code
          }
        }
        assignments(includeInactive: true) {
          _id
        }
      }
    }
    ticketProductionsCount(queryString: $queryString)
  }
`;

const useTicketProductions = ({
  limit,
  offset,
  queryString,
}: {
  limit: number;
  offset: number;
  queryString?: string;
}) => {
  const { data, loading, error } = useQuery<any>(TicketProductionsQuery, {
    variables: { limit, offset, queryString },
  });
  return {
    productions: data?.ticketProductions || [],
    productionsCount: data?.ticketProductionsCount || 0,
    loading,
    error,
  };
};

export default useTicketProductions;
