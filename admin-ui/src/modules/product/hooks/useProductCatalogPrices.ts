import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import {
  IProductCatalogPricesQuery,
  IProductCatalogPricesQueryVariables,
} from '../../../gql/types';
import ProductCatalogPriceFragment from '../fragments/ProductCatalogPriceFragment';

const ProductCatalogPricesQuery = gql`
  query ProductCatalogPrices($productId: ID!) {
    productCatalogPrices(productId: $productId) {
      ...ProductCatalogPriceFragment
    }
  }
  ${ProductCatalogPriceFragment}
`;

const useProductCatalogPrices = ({
  productId,
}: IProductCatalogPricesQueryVariables) => {
  const { data, loading, error } = useQuery<
    IProductCatalogPricesQuery,
    IProductCatalogPricesQueryVariables
  >(ProductCatalogPricesQuery, {
    skip: !productId,
    variables: {
      productId,
    },
  });
  const catalogPrices = data?.productCatalogPrices || [];

  return {
    catalogPrices,
    loading,
    error,
  };
};

export default useProductCatalogPrices;
