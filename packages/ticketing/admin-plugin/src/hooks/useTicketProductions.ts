import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

// Only what the list shows: no performances and no tickets.
const TicketProductionsQuery = gql`
  query TicketProductions($limit: Int, $offset: Int, $queryString: String, $tags: [LowerCaseString!]) {
    ticketProductions(limit: $limit, offset: $offset, queryString: $queryString, tags: $tags) {
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
    ticketProductionsCount(queryString: $queryString, tags: $tags)
  }
`;

const useTicketProductions = ({
  limit,
  offset,
  queryString,
  tags,
}: {
  limit: number;
  offset: number;
  queryString?: string;
  tags?: string[];
}) => {
  const { data, loading, error } = useQuery<any>(TicketProductionsQuery, {
    variables: { limit, offset, queryString, tags },
  });
  return {
    productions: data?.ticketProductions || [],
    productionsCount: data?.ticketProductionsCount || 0,
    loading,
    error,
  };
};

export default useTicketProductions;
