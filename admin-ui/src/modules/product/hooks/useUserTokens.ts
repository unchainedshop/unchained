import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  IUserTokensQuery,
  IUserTokensQueryVariables,
} from '../../../gql/types';
import ProductBriefFragment from '../fragments/ProductBriefFragment';
import TokenFragment from '../fragments/TokenFragment';

const UserTokensQuery = gql`
  query UserTokens($userId: ID!, $forceLocale: Locale) {
    user(userId: $userId) {
      _id
      web3Addresses {
        address
        nonce
        verified
      }

      tokens {
        ...TokenFragment
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
  ${TokenFragment}
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
  const web3Addresses = data?.user?.web3Addresses || [];

  return {
    tokens,
    web3Addresses,
    loading,
    error,
  };
};

export default useUserTokens;
