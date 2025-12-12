import { ApolloClient } from '@apollo/client';
import { GetTranslatedProductTextsQuery } from '../hooks/useTranslatedProductTexts';
import {
  IBundleProduct,
  IProduct,
  IProductBundleItemsQuery,
  IProductBundleItemsQueryVariables,
  IProductCatalogPricesQuery,
  IProductCatalogPricesQueryVariables,
  ITranslatedProductTextsQuery,
  ITranslatedProductTextsQueryVariables,
} from '../../../gql/types';
import { ProductCatalogPricesQuery } from '../hooks/useProductCatalogPrices';
import { ProductBundleItemQuery } from '../hooks/useProductBundleItems';
interface ProductExportMap {
  products: Record<string, Record<string, any>[]>;
  prices: Record<string, any[]>;
  bundles: Record<string, any[]>;
}

export async function fetchAllProductsForExport(
  products: IProduct[],
  client: ApolloClient,
) {
  const result: ProductExportMap = { products: {}, prices: {}, bundles: {} };
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

      if (product.__typename === 'BundleProduct') {
        const { data: bundleItems } = await client.query<
          IProductBundleItemsQuery,
          IProductBundleItemsQueryVariables
        >({
          query: ProductBundleItemQuery,
          variables: {
            productId: product._id,
          },
        });
        result.bundles[product._id] = (
          (bundleItems?.product as IBundleProduct)?.bundleItems || []
        ).map((item) => ({
          ...item,
          configuration: [
            { key: 'first', value: 'first value' },
            { key: 'second', value: 'second value' },
          ],
        }));
      }
    }),
  );

  return result;
}
