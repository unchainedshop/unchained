import { getDecimals, ProductType, type Product } from '@unchainedshop/core-products';
import type { ProductSearchToolOptions } from './search.ts';
import type { StorefrontToolContext } from './tool.ts';

export async function productResults(
  products: Product[],
  { modules, locale, currencyCode, countryCode }: StorefrontToolContext,
  productUrl: ProductSearchToolOptions['productUrl'],
) {
  if (!products.length) return [];
  const currency = await modules.currencies.findCurrency({ isoCode: currencyCode });
  const decimals = getDecimals(currency?.decimals);
  const unit = 10 ** decimals;
  const isoCurrency = /^[a-z]{3}$/i.test(currencyCode);
  const numberFormat = new Intl.NumberFormat(locale, {
    ...(isoCurrency && { style: 'currency', currency: currencyCode, currencyDisplay: 'code' }),
    minimumFractionDigits: Math.max(0, decimals),
    maximumFractionDigits: Math.max(0, decimals),
  });
  const format = (amount: number) => {
    const value = numberFormat.format(amount / unit);
    return isoCurrency ? value : `${currencyCode} ${value}`;
  };
  const market = { countryCode, currencyCode, quantity: 1 };
  return Promise.all(
    products.map(async (product) => {
      const configurable = product.type === ProductType.CONFIGURABLE_PRODUCT;
      const [texts, price, range] = await Promise.all([
        modules.products.texts.findLocalizedText({ productId: product._id, locale }),
        configurable ? null : modules.products.prices.price(product, market),
        configurable
          ? modules.products.prices.catalogPriceRange(product, { ...market, vectors: [] })
          : null,
      ]);
      const catalogPrice = price ?? range?.minPrice;
      return {
        id: product._id,
        name: texts?.title || product._id,
        ...(texts?.brand && { brand: texts.brand }),
        ...(texts?.description && { description: texts.description }),
        price: catalogPrice ? catalogPrice.amount / unit : null,
        currency: currencyCode,
        ...(catalogPrice && {
          formatted_price:
            range && range.maxPrice.amount !== catalogPrice.amount
              ? `${format(catalogPrice.amount)} – ${format(range.maxPrice.amount)}`
              : format(catalogPrice.amount),
          is_net_price: !!catalogPrice.isNetPrice,
        }),
        ...(range && {
          price_range: { min: range.minPrice.amount / unit, max: range.maxPrice.amount / unit },
        }),
        url: productUrl({ productId: product._id, slug: texts?.slug, locale }),
      };
    }),
  );
}
