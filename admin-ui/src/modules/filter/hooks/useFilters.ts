import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { IFiltersQuery, IFiltersQueryVariables } from '../../../gql/types';
import FilterFragment from '../fragments/FilterFragment';

const FiltersQuery = gql`
  query Filters(
    $queryString: String
    $limit: Int
    $offset: Int
    $includeInactive: Boolean
    $sort: [SortOptionInput!]
  ) {
    filters(
      queryString: $queryString
      limit: $limit
      offset: $offset
      includeInactive: $includeInactive
      sort: $sort
    ) {
      ...FilterFragment
      texts {
        _id
        title
        subtitle
        locale
      }
    }
    filtersCount(includeInactive: $includeInactive, queryString: $queryString)
  }
  ${FilterFragment}
`;

const useFilters = ({
  queryString = '',
  limit = 20,
  offset = 0,
  includeInactive = true,
  sort = [],
  forceLocale = '',
}: IFiltersQueryVariables & { forceLocale?: string } = {}) => {
  const { data, loading, error, fetchMore } = useQuery<
    IFiltersQuery,
    IFiltersQueryVariables & { forceLocale?: string }
  >(FiltersQuery, {
    context: {
      headers: {
        forceLocale,
      },
    },
    variables: {
      queryString,
      limit,
      offset,
      includeInactive,
      sort,
    },
  });
  const filters = data?.filters || [];
  const filtersCount = data?.filtersCount;
  const hasMore = filters?.length < filtersCount;
  const loadMore = () => {
    fetchMore({
      variables: { offset: filters?.length },
    });
  };
  return {
    filters,
    filtersCount,
    hasMore,
    loading,
    error,
    loadMore,
  };
};

export default useFilters;
