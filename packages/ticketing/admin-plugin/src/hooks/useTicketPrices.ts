import { gql } from '@apollo/client';
import { useApolloClient } from '@apollo/client/react';
import type { TicketPrice } from '../utils/production-form.ts';

const TicketPricesQuery = gql`
  query TicketPrices($productId: ID!) {
    productCatalogPrices(productId: $productId) {
      amount
      isTaxable
      isNetPrice
      minQuantity
      currency {
        isoCode
      }
      country {
        isoCode
      }
    }
  }
`;

const useTicketPrices = () => {
  const client = useApolloClient();
  return async (productId: string): Promise<TicketPrice[]> => {
    const { data } = await client.query<any>({
      query: TicketPricesQuery,
      variables: { productId },
      fetchPolicy: 'network-only',
    });
    return (data?.productCatalogPrices ?? []).map(({ currency, country, ...price }) => ({
      ...price,
      currencyCode: currency.isoCode,
      countryCode: country.isoCode,
    }));
  };
};

export default useTicketPrices;
