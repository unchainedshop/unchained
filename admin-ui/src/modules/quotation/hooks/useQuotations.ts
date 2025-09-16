import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  IQuotationsQuery,
  IQuotationsQueryVariables,
} from '../../../gql/types';
import QuotationFragment from '../fragments/QuotationFragment';

const QuotationsQuery = gql`
  query Quotations(
    $limit: Int
    $offset: Int
    $queryString: String
    $sort: [SortOptionInput!]
  ) {
    quotations(
      limit: $limit
      offset: $offset
      queryString: $queryString
      sort: $sort
    ) {
      ...QuotationFragment
    }
    quotationsCount(queryString: $queryString)
  }
  ${QuotationFragment}
`;

const useQuotations = ({
  limit = 20,
  offset = 0,
  queryString = '',
  sort = [],
}: IQuotationsQueryVariables = {}) => {
  const { data, loading, error, fetchMore } = useQuery<
    IQuotationsQuery,
    IQuotationsQueryVariables
  >(QuotationsQuery, {
    variables: { limit, offset, queryString, sort },
  });
  const quotations = data?.quotations || [];
  const quotationsCount = data?.quotationsCount;
  const hasMore = quotations?.length < quotationsCount;

  const loadMore = () => {
    fetchMore({
      variables: { offset: quotations?.length },
    });
  };

  return {
    quotations,
    quotationsCount,
    hasMore,
    loading,
    error,
    loadMore,
  };
};

export default useQuotations;
