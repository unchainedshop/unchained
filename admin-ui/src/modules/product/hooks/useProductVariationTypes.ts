import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  IProductVariationTypeQuery,
  IProductVariationTypeQueryVariables,
} from '../../../gql/types';

const ProductVariationTypesQuery = gql`
  query ProductVariationType {
    variationTypes: __type(name: "ProductVariationType") {
      options: enumValues {
        value: name
        label: description
      }
    }
  }
`;

const useProductVariationTypes = () => {
  const { data, loading, error } = useQuery<
    IProductVariationTypeQuery,
    IProductVariationTypeQueryVariables
  >(ProductVariationTypesQuery);

  const variationTypes = data?.variationTypes?.options || [];

  return {
    variationTypes,
    loading,
    error,
  };
};

export default useProductVariationTypes;
