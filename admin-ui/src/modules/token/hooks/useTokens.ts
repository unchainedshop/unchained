import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { ITokensQuery, ITokensQueryVariables } from '../../../gql/types';
import TokenFragment from '../../product/fragments/TokenFragment';
import ProductBriefFragment from '../../product/fragments/ProductBriefFragment';
import { DefaultLimit } from '../../common/data/miscellaneous';

const TokensQuery = gql`
  query Tokens(
    $queryString: String
    $limit: Int
    $offset: Int
    $forceLocale: Locale
  ) {
    tokens(queryString: $queryString, limit: $limit, offset: $offset) {
      ...TokenFragment
      product {
        ...ProductBriefFragment
        simulatedPrice {
          amount
          currencyCode
        }
      }
      user {
        _id
        username
        isGuest
        primaryEmail {
          address
          verified
        }
        avatar {
          _id
          url
        }
        profile {
          displayName
          address {
            firstName
            lastName
          }
        }
      }
    }
    tokensCount(queryString: $queryString)
  }
  ${TokenFragment}
  ${ProductBriefFragment}
`;

const useTokens = ({
  queryString = null,
  limit = DefaultLimit,
  offset = 0,
}: ITokensQueryVariables) => {
  const { data, loading, error } = useQuery<
    ITokensQuery,
    ITokensQueryVariables
  >(TokensQuery, {
    variables: { queryString, limit, offset },
  });
  const tokens = data?.tokens || [];

  return {
    tokens,
    loading,
    error,
    tokensCount: data?.tokensCount || 0,
  };
};

export default useTokens;
