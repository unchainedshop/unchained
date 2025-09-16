import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  IProductWarehousingQuery,
  IProductWarehousingQueryVariables,
} from '../../../gql/types';
import { parseUniqueId } from '../../common/utils/getUniqueId';

const ProductWarehousingQuery = gql`
  query ProductWarehousing($productId: ID, $slug: String) {
    product(productId: $productId, slug: $slug) {
      _id
      ... on SimpleProduct {
        sku
        baseUnit
      }
    }
  }
`;

const useProductWarehousing = ({
  productId: id = null,
  slug = null,
}: IProductWarehousingQueryVariables = {}) => {
  const parsedId = parseUniqueId(slug);
  const { data, loading, error } = useQuery<
    IProductWarehousingQuery,
    IProductWarehousingQueryVariables
  >(ProductWarehousingQuery, {
    skip: !id && !parsedId,
    variables: {
      productId: id || parsedId,
    },
  });

  const product = data?.product || {};

  return {
    product,
    loading,
    error,
  };
};

export default useProductWarehousing;
