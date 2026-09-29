import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { parseUniqueId } from '../utils/misc.ts';

// Attendee names come from the ticket (issued with the ticketMeta hook), the buyer only shows
// the public User.name: no private user data and no per-ticket redeemability check.
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
        tokensCount
        isCanceled
        eventStartsAt
        eventEndsAt
        eventDoorsOpenAt
        eventLocation
        eventCategory
        tokens {
          _id
          tokenSerialNumber
          quantity
          ticketStatus
          invalidatedDate
          cancelledDate
          attendeeName
          user {
            _id
            name
            avatar {
              _id
              url
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
