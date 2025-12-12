import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  IProductVariationsQuery,
  IProductVariationsQueryVariables,
} from '../../../gql/types';
import { parseUniqueId } from '../../common/utils/getUniqueId';

import ProductVariationFragment from '../fragments/ProductVariationFragment';

export const ProductVariationQuery = gql`
  query ProductVariations($productId: ID, $slug: String, $locale: Locale) {
    product(productId: $productId, slug: $slug) {
      _id
      ... on ConfigurableProduct {
        variations {
          ...ProductVariationFragment
        }
      }
    }
  }
  ${ProductVariationFragment}
`;

const useProductVariations = ({
  productId: id = null,
  slug = null,
  locale = null,
}: IProductVariationsQueryVariables = {}) => {
  const parsedId = parseUniqueId(slug);

  const { data, loading, error } = useQuery<
    IProductVariationsQuery,
    IProductVariationsQueryVariables
  >(ProductVariationQuery, {
    skip: !id && !parsedId,
    variables: { productId: id || parsedId, locale },
  });

  const product = data?.product as any;
  const variations = product?.variations;

  return {
    variations,
    loading,
    error,
  };
};

export default useProductVariations;
