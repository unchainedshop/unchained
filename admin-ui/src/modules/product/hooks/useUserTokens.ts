import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  IUserTokensQuery,
  IUserTokensQueryVariables,
} from '../../../gql/types';
import ProductBriefFragment from '../fragments/ProductBriefFragment';

const UserTokensQuery = gql`
  query UserTokens($userId: ID!, $forceLocale: Locale) {
    user(userId: $userId) {
      _id
      tokens {
        _id
        walletAddress
        status
        chainId
        tokenSerialNumber
        product {
          ...ProductBriefFragment
          simulatedPrice {
            amount
            currencyCode
          }
        }
      }
    }
  }
  ${ProductBriefFragment}
`;

const useUserTokens = ({ userId = null }: IUserTokensQueryVariables) => {
  const { data, loading, error } = useQuery<
    IUserTokensQuery,
    IUserTokensQueryVariables
  >(UserTokensQuery, {
    variables: { userId },
  });
  const tokens = data?.user?.tokens || [];

  return {
    tokens,
    loading,
    error,
  };
};

export default useUserTokens;
