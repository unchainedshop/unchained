import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { parseUniqueId } from '../utils/misc';

export const TicketEventDetailQuery = gql`
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
            avatar {
              _id
              url
            }
          }
          attendee {
            name
            email
            phone
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
