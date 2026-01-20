import { ProductPricingAdapter, type IProductPricingAdapter } from '@unchainedshop/core';
import { ProductType } from '@unchainedshop/core-products';

export const ProductPrice: IProductPricingAdapter = {
  ...ProductPricingAdapter,

  key: 'shop.unchained.pricing.product-price',
  version: '1.0.0',
  label: 'Add Gross Price to Product',
  orderIndex: 0,

  isActivatedFor: () => {
    return true;
  },

  actions: (params) => {
    const pricingAdapter = ProductPricingAdapter.actions(params);

    return {
      ...pricingAdapter,

      calculate: async () => {
        const { product, countryCode, currencyCode, quantity, modules } = params.context;
        const price = await modules.products.prices.price(product, {
          countryCode,
          currencyCode,
          quantity,
        });
        if (price) {
          const itemTotal = price.amount * quantity;
          pricingAdapter.resultSheet().addItem({
            amount: itemTotal,
            isTaxable: Boolean(price.isTaxable),
            isNetPrice: Boolean(price.isNetPrice),
            meta: { adapter: ProductPrice.key },
          });
        } else if (product.type === ProductType.BUNDLE_PRODUCT) {
          for (const bundleItem of product.bundleItems || []) {
            const bundledProduct = await modules.products.findProduct({
              productId: bundleItem.productId,
            });
            if (bundledProduct) {
              const bundleItemPrice = await modules.products.prices.price(bundledProduct, {
                countryCode,
                currencyCode,
                quantity: bundleItem.quantity * quantity,
              });
              if (bundleItemPrice) {
                const bundleItemTotal = bundleItemPrice.amount * bundleItem.quantity * quantity;
                pricingAdapter.resultSheet().addItem({
                  amount: bundleItemTotal,
                  isTaxable: Boolean(bundleItemPrice.isTaxable),
                  isNetPrice: Boolean(bundleItemPrice.isNetPrice),
                  meta: { adapter: ProductPrice.key },
                });
              }
            }
          }
        }

        return pricingAdapter.calculate();
      },
    };
  },
};

export default ProductPrice;
