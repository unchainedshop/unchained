import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { IUserCartQuery, IUserCartQueryVariables } from '@/gql/types';

const UserCartQuery = gql`
  query UserCart($userId: ID) {
    user(userId: $userId) {
      _id
      cart {
        _id
        created
        updated
        total {
          amount
          currencyCode
        }
        country {
          _id
          isoCode
          flagEmoji
        }
        items {
          _id
          quantity
          unitPrice {
            amount
            currencyCode
          }
          total {
            amount
            currencyCode
          }
          product {
            _id
            texts {
              _id
              slug
              title
              subtitle
            }
            media(limit: 1) {
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
  }
`;

const useUserCart = ({ userId = null }: { userId?: string } = {}) => {
  const { data, loading, error } = useQuery<
    IUserCartQuery,
    IUserCartQueryVariables
  >(UserCartQuery, {
    skip: !userId,
    variables: { userId },
  });

  return {
    cart: data?.user?.cart,
    loading,
    error,
  };
};

export default useUserCart;
