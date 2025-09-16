import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  IConfigurableProduct,
  IProductAssignmentsQuery,
  IProductAssignmentsQueryVariables,
} from '../../../gql/types';
import { parseUniqueId } from '../../common/utils/getUniqueId';

import ProductAssignmentFragment from '../fragments/ProductAssignmentFragment';

const ProductAssignmentQuery = gql`
  query ProductAssignments($productId: ID, $slug: String) {
    product(productId: $productId, slug: $slug) {
      _id
      ... on ConfigurableProduct {
        texts {
          _id
          subtitle
          slug
          title
        }
        variations {
          _id
          key
          texts {
            _id
            title
          }
          options {
            _id
            value
            texts {
              _id
              title
            }
          }
        }
        assignments(includeInactive: true) {
          ...ProductAssignmentFragment
        }
      }
    }
  }
  ${ProductAssignmentFragment}
`;

const useProductAssignments = ({
  productId: id = null,
  slug = null,
}: IProductAssignmentsQueryVariables = {}) => {
  const parsedId = parseUniqueId(slug);

  const { data, loading, error } = useQuery<
    IProductAssignmentsQuery,
    IProductAssignmentsQueryVariables
  >(ProductAssignmentQuery, {
    skip: !id && !parsedId,
    variables: { productId: id || parsedId },
  });

  const product = data?.product as IConfigurableProduct;

  return {
    product,
    loading,
    error,
  };
};

export default useProductAssignments;
