import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  IFilterOptionsQuery,
  IFilterOptionsQueryVariables,
} from '../../../gql/types';
import FilterOptionFragment from '../fragments/FilterOptionFragment';

const FilterOptionsQuery = gql`
  query FilterOptions($filterId: ID, $forceLocale: Locale) {
    filter(filterId: $filterId) {
      _id
      options {
        ...FilterOptionFragment
      }
    }
  }
  ${FilterOptionFragment}
`;

const useFilterOptions = ({
  filterId = null,
  locale,
}: IFilterOptionsQueryVariables & { locale?: string } = {}) => {
  const { data, loading, error } = useQuery<
    IFilterOptionsQuery,
    IFilterOptionsQueryVariables & { forceLocale?: string }
  >(FilterOptionsQuery, {
    skip: !filterId,
    variables: { filterId, forceLocale: locale },
  });

  return {
    filterOptions: data?.filter?.options || [],
    loading,
    error,
  };
};

export default useFilterOptions;
