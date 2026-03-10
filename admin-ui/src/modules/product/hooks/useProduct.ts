import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { IProductQuery, IProductQueryVariables } from '../../../gql/types';
import { parseUniqueId } from '../../common/utils/getUniqueId';
import useUnchainedContext from '../../UnchainedContext/useUnchainedContext';
import ProductDetailFragment from '../fragments/ProductDetailFragment';

const GetProductQuery = (inlineFragment = '') => gql`
  query Product($productId: ID, $slug: String) {
    product(productId: $productId, slug: $slug) {
      ...ProductDetailFragment
      ${inlineFragment}
      texts {
          _id
          title
          subtitle
          description
        }
      ... on SimpleProduct {
        texts {
          _id
          title
          subtitle
          description
        }
        proxies {
        __typename
      }
      }
      ... on ConfigurableProduct {
        texts {
          _id
          title
          subtitle
          description
        }
      }
      ... on PlanProduct {
        texts {
          _id
          title
          subtitle
          description
        }
        proxies {
        __typename
      }
      }
      ... on BundleProduct {
        texts {
          _id
          title
          subtitle
          description
        }
        proxies {
        __typename
      }
      }
      ... on TokenizedProduct {
        texts {
          _id
          title
          subtitle
          description
        }
        contractConfiguration {
          ercMetadataProperties
          supply
        }
        simulatedStocks {
          quantity
        }
        tokensCount
        tokens {
          _id
          tokenSerialNumber
          isCanceled
          invalidatedDate
          isInvalidateable
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
  ${ProductDetailFragment}
`;

const useProduct = ({
  productId: id = null,
  slug = null,
}: IProductQueryVariables = {}) => {
  const parsedId = parseUniqueId(slug);

  const { customProperties, hydrateFragment } = useUnchainedContext();
  const { data, loading, error } = useQuery<
    IProductQuery,
    IProductQueryVariables
  >(GetProductQuery(customProperties?.Product), {
    skip: !id && !parsedId,
    variables: { productId: id || parsedId },
  });

  const extendedData = hydrateFragment(
    customProperties?.Product,
    data?.product,
  );

  return {
    product: data?.product,
    loading,
    error,
    extendedData,
  };
};

export default useProduct;
