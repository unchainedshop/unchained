import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { parseUniqueId } from '../utils/misc';

const TicketEventDetailQuery = gql`
  query TicketEventDetail($productId: ID!) {
    product(productId: $productId) {
      _id
      status
      tags
      ... on TokenizedProduct {
        texts {
          _id
          slug
          title
          subtitle
          description
        }
        media(limit: 1) {
          _id
          file {
            _id
            url
            name
          }
        }
        contractConfiguration {
          ercMetadataProperties
          supply
        }
        simulatedStocks {
          quantity
        }
        tokensCount
        isCanceled
        scannerPassCode
        tokens {
          _id
          tokenSerialNumber
          invalidatedDate
          isInvalidateable
          isCanceled
          quantity
          status
          walletAddress
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
            lastContact {
              emailAddress
              telNumber
            }
          }
        }
      }
    }
  }
`;

const useEventProduct = ({ slug }: { slug: string }) => {
  const productId = parseUniqueId(slug);

  const { data, loading, error } = useQuery<any>(TicketEventDetailQuery, {
    skip: !productId,
    variables: { productId },
  });

  return {
    product: data?.product,
    loading,
    error,
  };
};

export default useEventProduct;
