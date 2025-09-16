import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  ICurrenciesQuery,
  ICurrenciesQueryVariables,
} from '../../../gql/types';
import CurrencyFragment from '../fragments/CurrencyFragment';

const CurrenciesQuery = gql`
  query Currencies(
    $queryString: String
    $limit: Int
    $offset: Int
    $includeInactive: Boolean
    $sort: [SortOptionInput!]
  ) {
    currencies(
      queryString: $queryString
      limit: $limit
      offset: $offset
      includeInactive: $includeInactive
      sort: $sort
    ) {
      ...CurrencyFragment
    }
    currenciesCount(
      includeInactive: $includeInactive
      queryString: $queryString
    )
  }
  ${CurrencyFragment}
`;

const useCurrencies = ({
  queryString = '',
  limit = 20,
  offset = 0,
  includeInactive = true,
  sort = [],
}: ICurrenciesQueryVariables = {}) => {
  const { data, loading, error, fetchMore } = useQuery<
    ICurrenciesQuery,
    ICurrenciesQueryVariables
  >(CurrenciesQuery, {
    variables: { queryString, limit, offset, includeInactive, sort },
  });

  const currencies = data?.currencies || [];
  const currenciesCount = data?.currenciesCount;
  const hasMore = currencies?.length < currenciesCount;

  const loadMore = () => {
    fetchMore({
      variables: { offset: currencies?.length },
    });
  };

  return {
    currencies,
    currenciesCount,
    hasMore,
    loading,
    error,
    loadMore,
  };
};

export default useCurrencies;
