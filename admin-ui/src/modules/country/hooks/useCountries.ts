import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { ICountriesQuery, ICountriesQueryVariables } from '../../../gql/types';
import CountryFragment from '../fragments/CountryFragment';

const CountriesQuery = gql`
  query Countries(
    $queryString: String
    $limit: Int
    $offset: Int
    $includeInactive: Boolean
    $sort: [SortOptionInput!]
  ) {
    countries(
      queryString: $queryString
      limit: $limit
      offset: $offset
      includeInactive: $includeInactive
      sort: $sort
    ) {
      ...CountryFragment
    }
    countriesCount(includeInactive: $includeInactive, queryString: $queryString)
  }

  ${CountryFragment}
`;

const useCountries = ({
  queryString = '',
  limit = 20,
  offset = 0,
  includeInactive = true,
  sort = [],
} = {}) => {
  const { data, loading, error, fetchMore } = useQuery<
    ICountriesQuery,
    ICountriesQueryVariables
  >(CountriesQuery, {
    variables: { queryString, limit, offset, includeInactive, sort },
  });

  const countries = data?.countries || [];
  const countriesCount = data?.countriesCount;
  const hasMore = countries?.length < countriesCount;

  const loadMore = () => {
    fetchMore({
      variables: { offset: countries?.length },
    });
  };

  return {
    countries,
    countriesCount,
    hasMore,
    loading,
    error,
    loadMore,
  };
};

export default useCountries;
