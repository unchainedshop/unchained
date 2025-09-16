import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  IProductTokenizationQuery,
  IProductTokenizationQueryVariables,
  ITokenizedProduct,
} from '../../../gql/types';
import { parseUniqueId } from '../../common/utils/getUniqueId';

const ProductTokenizationQuery = gql`
  query ProductTokenization($productId: ID, $slug: String) {
    product(productId: $productId, slug: $slug) {
      _id
      ... on TokenizedProduct {
        contractConfiguration {
          tokenId
          supply
        }
        contractStandard
        contractAddress
      }
    }
  }
`;

const useProductTokenization = ({
  productId: id = null,
  slug = null,
}: IProductTokenizationQueryVariables = {}) => {
  const parsedId = parseUniqueId(slug);

  const { data, loading, error } = useQuery<
    IProductTokenizationQuery,
    IProductTokenizationQueryVariables
  >(ProductTokenizationQuery, {
    skip: !id && !slug,
    variables: {
      productId: id || parsedId,
    },
  });

  const product = data?.product as ITokenizedProduct;

  return {
    product,
    loading,
    error,
  };
};

export default useProductTokenization;
