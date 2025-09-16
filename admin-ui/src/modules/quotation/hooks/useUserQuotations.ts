import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  IUserQuotationsQuery,
  IUserQuotationsQueryVariables,
} from '../../../gql/types';
import QuotationFragment from '../fragments/QuotationFragment';

const UserQuotationsQuery = gql`
  query UserQuotations($userId: ID!, $queryString: String) {
    user(userId: $userId) {
      _id
      quotations(queryString: $queryString) {
        ...QuotationFragment
      }
    }
  }
  ${QuotationFragment}
`;

const useUserQuotations = ({
  userId = null,
  queryString = '',
}: IUserQuotationsQueryVariables) => {
  const { data, loading, error } = useQuery<
    IUserQuotationsQuery,
    IUserQuotationsQueryVariables
  >(UserQuotationsQuery, {
    skip: !userId,
    variables: { userId, queryString },
  });
  const quotations = data?.user?.quotations || [];

  return {
    quotations,
    loading,
    error,
  };
};

export default useUserQuotations;
