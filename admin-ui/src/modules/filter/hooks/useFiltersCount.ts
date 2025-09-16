import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  IFiltersCountQuery,
  IFiltersCountQueryVariables,
} from '../../../gql/types';

const FiltersCountQuery = gql`
  query FiltersCount($queryString: String, $includeInactive: Boolean) {
    filtersCount(includeInactive: $includeInactive, queryString: $queryString)
  }
`;

const useFiltersCount = ({
  queryString = '',
  includeInactive = true,
}: IFiltersCountQueryVariables = {}) => {
  const { data, loading, error } = useQuery<
    IFiltersCountQuery,
    IFiltersCountQueryVariables
  >(FiltersCountQuery, {
    variables: {
      queryString,
      includeInactive,
    },
  });

  const filtersCount = data?.filtersCount;

  return {
    filtersCount,
    loading,
    error,
  };
};

export default useFiltersCount;
