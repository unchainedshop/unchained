import type { Context } from '@unchainedshop/api';
import { getDecimals, type Product, ProductType } from '@unchainedshop/core-products';
import type { StorefrontMarket } from './market.ts';

export type ProductUrlBuilder = (product: {
  productId: string;
  slug?: string;
  locale: Intl.Locale;
  countryCode: string;
  currencyCode: string;
}) => string;

async function primaryImageUrl({ loaders, services }: Context, productId: string) {
  const [media] = await loaders.productMediasLoader.load({ productId });
  const file = media && (await loaders.fileLoader.load({ fileId: media.mediaId }));
  if (!file || file.meta?.isPrivate) return undefined;
  return (await services.files.createFileDownloadURL({ file })) ?? undefined;
}

async function catalogPrices(context: Context, product: Product, market: StorefrontMarket) {
  const { countryCode, currencyCode } = market;
  if (product.type !== ProductType.CONFIGURABLE_PRODUCT) {
    const price = await context.modules.products.prices.price(product, {
      countryCode,
      currencyCode,
      quantity: 1,
    });
    return price && { min: price, max: price };
  }
  const range = await context.modules.products.prices.catalogPriceRange(product, {
    quantity: 1,
    vectors: [],
    countryCode,
    currencyCode,
  });
  return range && { min: range.minPrice, max: range.maxPrice };
}

export async function productResults(
  context: Context,
  products: Product[],
  market: StorefrontMarket,
  productUrl: ProductUrlBuilder,
) {
  const { locale, countryCode, currencyCode } = market;
  const currency = await context.loaders.currencyLoader.load({ isoCode: currencyCode });
  const decimals = getDecimals(currency?.decimals);
  const isIsoCurrency = /^[A-Z]{3}$/.test(currencyCode);
  const numberFormat = new Intl.NumberFormat(locale.baseName, {
    ...(isIsoCurrency && { style: 'currency', currency: currencyCode }),
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const format = (amount: number) => {
    const formatted = numberFormat.format(amount / 10 ** decimals);
    return isIsoCurrency ? formatted : `${currencyCode} ${formatted}`;
  };

  return Promise.all(
    products.map(async (product) => {
      const [texts, image, prices] = await Promise.all([
        context.loaders.productTextLoader.load({ productId: product._id, locale }),
        primaryImageUrl(context, product._id),
        catalogPrices(context, product, market),
      ]);
      const price = (amount: number) => ({ amount, formatted: format(amount) });
      return {
        id: product._id,
        title: texts?.title || product._id,
        ...(texts?.brand && { brand: texts.brand }),
        ...(texts?.description && { description: texts.description }),
        ...(image && { image }),
        url: productUrl({
          productId: product._id,
          slug: texts?.slug,
          locale,
          countryCode,
          currencyCode,
        }),
        price: prices
          ? {
              ...price(prices.min.amount),
              currency: currencyCode,
              isNetPrice: Boolean(prices.min.isNetPrice),
              ...(prices.max.amount !== prices.min.amount && { maxPrice: price(prices.max.amount) }),
            }
          : null,
      };
    }),
  );
}
