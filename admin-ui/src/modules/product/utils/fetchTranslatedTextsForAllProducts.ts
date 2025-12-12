import { ApolloClient } from '@apollo/client';
import { GetTranslatedProductTextsQuery } from '../hooks/useTranslatedProductTexts';
import {
  IProduct,
  IProductCatalogPricesQuery,
  IProductCatalogPricesQueryVariables,
  ITranslatedProductTextsQuery,
  ITranslatedProductTextsQueryVariables,
} from '../../../gql/types';
import { ProductCatalogPricesQuery } from '../hooks/useProductCatalogPrices';
interface ProductExportMap {
  products: Record<string, Record<string, any>[]>;
  prices: Record<string, Record<string, any>>;
}

export async function fetchTranslatedTextsForAllProducts(
  products: IProduct[],
  client: ApolloClient,
) {
  const result: ProductExportMap = { products: {}, prices: {} };

  await Promise.all(
    products.map(async (product: any) => {
      const { data } = await client.query<
        ITranslatedProductTextsQuery,
        ITranslatedProductTextsQueryVariables
      >({
        query: GetTranslatedProductTextsQuery(),
        variables: { productId: product._id },
      });

      result.products[product._id] = data?.translatedProductTexts || [];

      const { data: pricesData } = await client.query<
        IProductCatalogPricesQuery,
        IProductCatalogPricesQueryVariables
      >({
        query: ProductCatalogPricesQuery,
        variables: {
          productId: product._id,
        },
      });
      result.prices[product._id] = pricesData?.productCatalogPrices || [];
    }),
  );

  return result;
}
