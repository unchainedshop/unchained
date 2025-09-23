import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { IShopInfoQuery, IShopInfoQueryVariables } from '../../../gql/types';

const ShopInfoQuery = gql`
  query ShopInfo {
    shopInfo {
      _id
      version
      language {
        _id
        isoCode
        name
      }
      country {
        _id
        isoCode
        flagEmoji
        name
        defaultCurrency {
          _id
          isoCode
        }
      }
      adminUiConfig {
        singleSignOnURL
        externalLinks {
          href
          title
          target
        }
        customProperties {
          entityName
          inlineFragment
        }
        productTags
        assortmentTags
        userTags
      }
    }
  }
`;

const useShopInfo = () => {
  const { data, loading, error } = useQuery<
    IShopInfoQuery,
    IShopInfoQueryVariables
  >(ShopInfoQuery, {
    fetchPolicy: 'cache-first',
  });
  const { shopInfo } = data || {};
  return {
    shopInfo,
    defaultLocale: [
      shopInfo?.language?.isoCode,
      shopInfo?.country?.isoCode?.toUpperCase(),
    ]
      ?.filter(Boolean)
      ?.join('-'),
    loading,
    error,
  };
};

export default useShopInfo;
