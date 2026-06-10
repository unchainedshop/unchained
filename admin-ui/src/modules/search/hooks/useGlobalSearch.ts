import { gql } from '@apollo/client';
import { useLazyQuery } from '@apollo/client/react';
import { useCallback, useRef, useState } from 'react';
import GlobalSearchProductFragment from '../fragments/GlobalSearchFragment';
import type {
  IGlobalSearchQuery,
  IGlobalSearchQueryVariables,
} from '../../../gql/types';

const GLOBAL_SEARCH_QUERY = gql`
  query GlobalSearch(
    $query: String!
    $types: [SearchableEntity!]
    $limit: Int
    $includeDraftProducts: Boolean
    $includeInactiveAssortments: Boolean
    $includeInactiveFilters: Boolean
    $includeGuestUsers: Boolean
    $includeCarts: Boolean
  ) {
    globalSearch(
      query: $query
      types: $types
      limit: $limit
      includeDraftProducts: $includeDraftProducts
      includeInactiveAssortments: $includeInactiveAssortments
      includeInactiveFilters: $includeInactiveFilters
      includeGuestUsers: $includeGuestUsers
      includeCarts: $includeCarts
    ) {
      counts {
        type
        totalCount
      }
      results {
        ...GlobalSearchProductFragment
        ... on User {
          _id
          __typename
          username
          name
          emails {
            address
            verified
          }
          avatar {
            url
          }
        }
        ... on Order {
          _id
          __typename
          orderNumber
        }
        ... on Assortment {
          _id
          __typename
          texts {
            _id
            title
            slug
          }
          media(limit: 1) {
            file {
              url
            }
          }
        }
        ... on Filter {
          _id
          __typename
          key
        }
        ... on Enrollment {
          _id
          __typename
        }
        ... on Quotation {
          _id
          __typename
        }
        ... on Work {
          _id
          __typename
          type
        }
      }
    }
  }
  ${GlobalSearchProductFragment}
`;

interface SearchOptions {
  includeDraftProducts?: boolean;
  includeInactiveAssortments?: boolean;
  includeInactiveFilters?: boolean;
  includeGuestUsers?: boolean;
  includeCarts?: boolean;
}

const useGlobalSearch = (options: SearchOptions = {}) => {
  const {
    includeDraftProducts = true,
    includeInactiveAssortments = true,
    includeInactiveFilters = true,
    includeGuestUsers = false,
    includeCarts = false,
  } = options;

  const [cleared, setCleared] = useState(false);
  const abortRef = useRef<(() => void) | null>(null);
  const [searchFn, { data, loading, error, called }] = useLazyQuery<
    IGlobalSearchQuery,
    IGlobalSearchQueryVariables
  >(GLOBAL_SEARCH_QUERY, {
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });

  const search = useCallback(
    (
      query: string,
      types?: IGlobalSearchQueryVariables['types'],
      limit?: number,
    ) => {
      setCleared(false);
      const result = searchFn({
        variables: {
          query,
          types,
          limit,
          includeDraftProducts,
          includeInactiveAssortments,
          includeInactiveFilters,
          includeGuestUsers,
          includeCarts,
        },
      });
      return result;
    },
    [
      searchFn,
      includeDraftProducts,
      includeInactiveAssortments,
      includeInactiveFilters,
      includeGuestUsers,
      includeCarts,
    ],
  );

  const clear = useCallback(() => {
    setCleared(true);
    if (abortRef.current) {
      abortRef.current();
      abortRef.current = null;
    }
  }, []);

  const results = cleared ? [] : data?.globalSearch?.results || [];
  const counts = cleared ? [] : data?.globalSearch?.counts || [];

  return {
    search,
    clear,
    results,
    counts,
    loading: loading && called && !cleared,
    error,
  };
};

export default useGlobalSearch;
