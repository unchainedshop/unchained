import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  IProductMediaQuery,
  IProductMediaQueryVariables,
} from '../../../gql/types';
import { parseUniqueId } from '../../common/utils/getUniqueId';
import ProductMediaFragment from '../fragments/ProductMediaFragment';

const ProductMediaQuery = gql`
  query ProductMedia($productId: ID, $slug: String) {
    product(productId: $productId, slug: $slug) {
      _id
      media {
        ...ProductMediaFragment
      }
    }
  }
  ${ProductMediaFragment}
`;

const useProductMedia = ({
  productId: id = null,
  slug = null,
}: IProductMediaQueryVariables = {}) => {
  const parsedId = parseUniqueId(slug);
  const { data, loading, error } = useQuery<
    IProductMediaQuery,
    IProductMediaQueryVariables
  >(ProductMediaQuery, {
    skip: !id && !parsedId,
    variables: { productId: id || parsedId },
  });

  const productMedia = data?.product?.media || [];

  return {
    productMedia,
    loading,
    error,
  };
};

export default useProductMedia;
