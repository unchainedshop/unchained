import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  IProductSupplyQuery,
  IProductSupplyQueryVariables,
  ISimpleProduct,
} from '../../../gql/types';
import { parseUniqueId } from '../../common/utils/getUniqueId';

import ProductDimensionFragment from '../fragments/ProductDimensionFragment';

const ProductSupplyQuery = gql`
  query ProductSupply($productId: ID, $slug: String) {
    product(productId: $productId, slug: $slug) {
      _id
      ... on SimpleProduct {
        dimensions {
          ...ProductDimensionFragment
        }
      }
    }
  }
  ${ProductDimensionFragment}
`;

const useProductSupply = ({
  productId: id = null,
  slug = null,
}: IProductSupplyQueryVariables = {}) => {
  const parsedId = parseUniqueId(slug);

  const { data, loading, error } = useQuery<
    IProductSupplyQuery,
    IProductSupplyQueryVariables
  >(ProductSupplyQuery, {
    skip: !id && !slug,
    variables: {
      productId: id || parsedId,
    },
  });

  const product = data?.product as ISimpleProduct;
  const dimensions = product?.dimensions || {};

  return {
    dimensions,
    loading,
    error,
  };
};

export default useProductSupply;
