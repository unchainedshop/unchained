import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { useAuth } from '@unchainedshop/admin-ui/hooks';
import { parseUniqueId } from '../utils/misc.ts';

// Attendee names come from the ticket (issued with the ticketMeta hook), the buyer only shows
// the public User.name: no private user data and no per-ticket redeemability check.
export const TicketEventDetailQuery = gql`
  query TicketEventDetail($productId: ID!, $withContacts: Boolean = false) {
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
          supply
        }
        tokensCount
        event {
          isCanceled
          startsAt
          endsAt
          doorsOpenAt
          location
          category
          categoryTitle
          durationMinutes
          doorsOpenMinutesBefore
          overridden
          ownSaleRules {
            onSale
            salesStart
            salesEnd
            maxPerOrder
          }
        }
        proxies {
          ... on ConfigurableProduct {
            _id
            tags
            texts {
              _id
              slug
              title
            }
            ticketProduction {
              saleRules {
                onSale
                salesStart
                salesEnd
                maxPerOrder
              }
            }
          }
        }
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
            primaryEmail @include(if: $withContacts) {
              address
            }
            lastContact @include(if: $withContacts) {
              emailAddress
              telNumber
            }
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

  // Buyer e-mail and phone only for viewers who may see them
  const withContacts = useAuth().hasRole('viewUserContactInfos');
  const { data, loading, error } = useQuery<any>(TicketEventDetailQuery, {
    skip: !productId,
    variables: { productId, withContacts },
  });

  return {
    product: data?.product,
    loading,
    error,
  };
};

export default useEventProduct;
