import { ApolloClient } from '@apollo/client';
import { GetTranslatedProductTextsQuery } from '../hooks/useTranslatedProductTexts';
import {
  IBundleProduct,
  IConfigurableProduct,
  IProduct,
  IProductBundleItemsQuery,
  IProductBundleItemsQueryVariables,
  IProductCatalogPricesQuery,
  IProductCatalogPricesQueryVariables,
  IProductVariationsQuery,
  IProductVariationsQueryVariables,
  ITranslatedProductTextsQuery,
  ITranslatedProductTextsQueryVariables,
} from '../../../gql/types';
import { ProductCatalogPricesQuery } from '../hooks/useProductCatalogPrices';
import { ProductBundleItemQuery } from '../hooks/useProductBundleItems';
import { ProductVariationQuery } from '../hooks/useProductVariations';
interface ProductExportMap {
  products: Record<string, Record<string, any>[]>;
  prices: Record<string, any[]>;
  bundles: Record<string, any[]>;
  variations: Record<string, Record<string, any>>;
}

export async function fetchAllProductsForExport(
  products: IProduct[],
  client: ApolloClient,
  locales?: string[],
) {
  const result: ProductExportMap = {
    products: {},
    prices: {},
    bundles: {},
    variations: {},
  };
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

      if (product.__typename === 'ConfigurableProduct') {
        await Promise.all(
          locales.map(async (locale) => {
            const { data } = await client.query<
              IProductVariationsQuery,
              IProductVariationsQueryVariables
            >({
              query: ProductVariationQuery,
              variables: { productId: product._id, locale },
            });

            const variations =
              (data?.product as IConfigurableProduct)?.variations || [];

            variations.forEach((v) => {
              if (!result.variations[product._id])
                result.variations[product._id] = {};
              if (!result.variations[product._id][v._id]) {
                result.variations[product._id][v._id] = {
                  _id: v._id,
                  type: v.type ?? '',
                  key: v.key ?? '',
                };
              }

              result.variations[product._id][v._id][locale] = v.texts || {};
            });
          }),
        );
      }
    }),
  );

  return result;
}
