import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

// Sold tickets are counted, the tickets themselves are only loaded on a performance.
const TicketProductionDetailQuery = gql`
  query TicketProductionDetail($productId: ID!, $locale: Locale) {
    product(productId: $productId) {
      _id
      status
      tags
      texts(forceLocale: $locale) {
        _id
        slug
        title
        subtitle
        description
      }
      media {
        _id
        tags
        file {
          _id
          url
          name
        }
      }
      ... on ConfigurableProduct {
        ticketProduction {
          location
          durationMinutes
          doorsOpenMinutesBefore
          saleRules {
            onSale
            salesStart
            salesEnd
            maxPerOrder
          }
          categories {
            code
            capacity
            pricing {
              amount
              currencyCode
              countryCode
            }
            option {
              _id
              value
              texts(forceLocale: $locale) {
                _id
                title
              }
            }
          }
        }
        assignments(includeInactive: true) {
          _id
          vectors {
            _id
            variation {
              _id
              key
            }
            option {
              _id
              value
            }
          }
          product {
            _id
            status
            ... on TokenizedProduct {
              texts {
                _id
                slug
              }
              tokensCount
              contractConfiguration {
                supply
              }
              catalogPrice {
                amount
                currencyCode
              }
              event {
                startsAt
                location
                durationMinutes
                doorsOpenMinutesBefore
                isCanceled
                overridden
                ownSaleRules {
                  onSale
                  salesStart
                  salesEnd
                  maxPerOrder
                }
              }
            }
          }
        }
      }
    }
  }
`;

const useTicketProduction = ({ productId, locale }: { productId: string; locale?: string }) => {
  const { data, loading, error, refetch } = useQuery<any>(TicketProductionDetailQuery, {
    skip: !productId,
    variables: { productId, locale },
  });
  return { production: data?.product, loading, error, refetch };
};

export default useTicketProduction;
