import { FilterAdapter, type IFilterAdapter, type IPlugin } from '@unchainedshop/core';
import { type Product, ProductStatus, ProductType } from '@unchainedshop/core-products';

export interface CatalogPriceMarket {
  countryCode: string;
  currencyCode: string;
}

export function createCatalogPriceFilterPlugin({
  filters,
}: {
  filters: Record<string, CatalogPriceMarket>;
}): IPlugin {
  const marketOf = ({ type, key }: { type: string; key: string }) =>
    type === 'RANGE' && Object.hasOwn(filters, key) ? filters[key] : null;

  const CatalogPriceFilter: IFilterAdapter = {
    ...FilterAdapter,
    key: 'shop.unchained.filters.catalog-price',
    label: 'Catalog price',
    version: '1.0.0',
    orderIndex: 0,

    generatedOptions: {
      appliesTo: (filter) => Boolean(marketOf(filter)),

      async buildProductIdMap(filter, { modules }) {
        const market = marketOf(filter)!;
        const products = await modules.products.findProducts(
          { includeDrafts: true },
          { projection: { _id: 1, type: 1, status: 1, commerce: 1, proxy: 1 } },
        );
        const productsById = new Map(products.map((product) => [product._id, product]));
        const pricedVariants = (product: Product) =>
          product.type === ProductType.CONFIGURABLE_PRODUCT
            ? (product.proxy?.assignments || []).flatMap(({ productId }) => {
                const variant = productsById.get(productId);
                return variant?.status === ProductStatus.ACTIVE ? [variant] : [];
              })
            : [product];

        const productIdsByAmount = new Map<string, Set<string>>();
        for (const product of products) {
          for (const variant of pricedVariants(product)) {
            const price = await modules.products.prices.price(variant, { ...market, quantity: 1 });
            if (typeof price?.amount !== 'number') continue;
            const amount = String(price.amount);
            if (!productIdsByAmount.has(amount)) productIdsByAmount.set(amount, new Set());
            productIdsByAmount.get(amount)!.add(product._id);
          }
        }

        const productIdMap: Record<string, string[]> = Object.create(null);
        for (const [amount, productIds] of productIdsByAmount) productIdMap[amount] = [...productIds];
        return [[...new Set(Object.values(productIdMap).flat())], productIdMap];
      },
    },

    actions: (params) => ({
      ...FilterAdapter.actions(params),

      transformFilterSelector: async (selector, options) => {
        const { countryCode, currencyCode } = options || {};
        if (!selector || !countryCode || !currencyCode) return selector;
        const otherMarketKeys = Object.entries(filters).flatMap(([key, market]) =>
          market.countryCode === countryCode && market.currencyCode === currencyCode ? [] : [key],
        );
        if (!otherMarketKeys.length) return selector;
        return { ...selector, $and: [...(selector.$and || []), { key: { $nin: otherMarketKeys } }] };
      },
    }),
  };

  return {
    key: CatalogPriceFilter.key,
    label: 'Catalog Price Filter Plugin',
    version: '1.0.0',
    adapters: [CatalogPriceFilter],
  };
}

export default createCatalogPriceFilterPlugin;
