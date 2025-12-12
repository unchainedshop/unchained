import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { ITokenQuery, ITokenQueryVariables } from '../../../gql/types';
import TokenFragment from '../../product/fragments/TokenFragment';
import ProductBriefFragment from '../../product/fragments/ProductBriefFragment';

const TokenQuery = gql`
  query Token($tokenId: ID!, $forceLocale: Locale) {
    token(tokenId: $tokenId) {
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
        avatar {
          _id
          url
        }
        name
        primaryEmail {
          verified
          address
        }
        lastContact {
          telNumber
          emailAddress
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
  }
  ${TokenFragment}
  ${ProductBriefFragment}
`;

const useToken = ({ tokenId }: ITokenQueryVariables) => {
  const { data, loading, error } = useQuery<ITokenQuery, ITokenQueryVariables>(
    TokenQuery,
    {
      variables: { tokenId },
    },
  );

  return {
    token: data?.token,
    loading,
    error,
  };
};

export default useToken;
