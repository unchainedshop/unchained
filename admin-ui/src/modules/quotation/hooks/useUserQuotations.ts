import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  IUserQuotationsQuery,
  IUserQuotationsQueryVariables,
} from '../../../gql/types';

const UserQuotationsQuery = gql`
  query UserQuotations($userId: ID!, $queryString: String) {
    user(userId: $userId) {
      _id
      quotations(queryString: $queryString) {
        _id
        status
        created
        expires
        isExpired
        quotationNumber
        product {
          _id
          texts {
            _id
            slug
            subtitle
            title
          }
          media {
            _id
            file {
              _id
              url
            }
          }
        }
      }
    }
  }
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
