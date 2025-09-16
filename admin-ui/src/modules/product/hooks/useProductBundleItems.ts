import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  IBundleProduct,
  IProductBundleItemsQuery,
  IProductBundleItemsQueryVariables,
} from '../../../gql/types';
import { parseUniqueId } from '../../common/utils/getUniqueId';
import ProductBriefFragment from '../fragments/ProductBriefFragment';

const ProductBundleItemQuery = gql`
  query ProductBundleItems($productId: ID, $slug: String) {
    product(productId: $productId, slug: $slug) {
      _id
      ... on BundleProduct {
        bundleItems {
          product {
            ...ProductBriefFragment
          }
          quantity
        }
      }
    }
  }
  ${ProductBriefFragment}
`;

const useProductBundleItems = ({
  productId: id = null,
  slug = null,
}: IProductBundleItemsQueryVariables = {}) => {
  const parsedId = parseUniqueId(slug);
  const { data, loading, error } = useQuery<
    IProductBundleItemsQuery,
    IProductBundleItemsQueryVariables
  >(ProductBundleItemQuery, {
    skip: !id && !parsedId,
    variables: { productId: id || parsedId },
  });

  const bundleItems = (data?.product as IBundleProduct)?.bundleItems || [];

  return {
    bundleItems,
    loading,
    error,
  };
};

export default useProductBundleItems;
