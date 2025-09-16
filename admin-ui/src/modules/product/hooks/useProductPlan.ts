import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  IPlanProduct,
  IProductPlanQuery,
  IProductPlanQueryVariables,
} from '../../../gql/types';
import { parseUniqueId } from '../../common/utils/getUniqueId';

import ProductPlanConfigurationFragment from '../fragments/ProductPlanConfigurationFragment';

const ProductPlanQuery = gql`
  query ProductPlan($productId: ID, $slug: String) {
    product(productId: $productId, slug: $slug) {
      _id
      ... on PlanProduct {
        plan {
          ...ProductPlanConfigurationFragment
        }
      }
    }
  }
  ${ProductPlanConfigurationFragment}
`;

const useProductPlan = ({
  productId: id = null,
  slug = null,
}: IProductPlanQueryVariables = {}) => {
  const parsedId = parseUniqueId(slug);
  const { data, loading, error } = useQuery<
    IProductPlanQuery,
    IProductPlanQueryVariables
  >(ProductPlanQuery, {
    skip: !id && !parsedId,
    variables: {
      productId: id || parsedId,
    },
  });

  const product = data?.product as IPlanProduct;

  return {
    plan: product?.plan,
    loading,
    error,
  };
};

export default useProductPlan;
