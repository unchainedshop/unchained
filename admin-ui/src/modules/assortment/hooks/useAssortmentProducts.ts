import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  IAssortmentProductsQuery,
  IAssortmentProductsQueryVariables,
} from '../../../gql/types';
import { parseUniqueId } from '../../common/utils/getUniqueId';
import ProductBriefFragment from '../../product/fragments/ProductBriefFragment';
import useApp from '../../common/hooks/useApp';

const AssortmentProductsQuery = gql`
  query AssortmentProducts(
    $assortmentId: ID
    $slug: String
    $forceLocale: Locale
  ) {
    assortment(assortmentId: $assortmentId, slug: $slug) {
      _id
      productAssignments {
        _id
        sortKey
        tags
        product {
          ...ProductBriefFragment
        }
      }
    }
  }
  ${ProductBriefFragment}
`;

const useAssortmentProducts = ({
  assortmentId: id = null,
  slug = null,
}: IAssortmentProductsQueryVariables = {}) => {
  const { selectedLocale } = useApp();
  const parsedId = parseUniqueId(slug);
  const { data, loading, error } = useQuery<IAssortmentProductsQuery>(
    AssortmentProductsQuery,
    {
      skip: !id && !parsedId,
      variables: {
        assortmentId: id || parsedId,
        forceLocale: selectedLocale,
      },
      context: {
        headers: {
          forceLocale: selectedLocale,
        },
      },
    },
  );
  const assortment = data?.assortment;
  const linkedProducts = assortment?.productAssignments || [];
  return {
    loading,
    error,
    linkedProducts,
  };
};

export default useAssortmentProducts;
