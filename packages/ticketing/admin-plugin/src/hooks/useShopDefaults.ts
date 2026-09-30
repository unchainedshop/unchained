import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import type { ShopDefaults } from '../utils/production-form.ts';

const ShopDefaultsQuery = gql`
  query TicketingShopDefaults {
    shopInfo {
      _id
      language {
        _id
        isoCode
      }
      country {
        _id
        isoCode
        defaultCurrency {
          _id
          isoCode
        }
      }
    }
  }
`;

/** The locale of new texts and the currency and country of new prices: the shop defaults. */
const useShopDefaults = (): ShopDefaults & { loading: boolean } => {
  const { data, loading } = useQuery<any>(ShopDefaultsQuery);
  const shop = data?.shopInfo;
  return {
    loading,
    locale: shop?.language?.isoCode || 'de',
    countryCode: shop?.country?.isoCode || 'CH',
    currencyCode: shop?.country?.defaultCurrency?.isoCode || 'CHF',
  };
};

export default useShopDefaults;
